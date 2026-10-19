# TECHNICAL DESIGN — Шифрование и управление ключами

## 1. Область документа

Документ описывает V1 архитектуры шифрования чувствительных пользовательских данных, управления ключами, recovery, rotation, integrity и disaster backup.

Целевая инфраструктура — один Beget VPS плюс отдельное provider object storage для backup.

Вне основной гарантии: полный root-захват работающего VPS/процесса Key Service.

## 2. Техническая цель

Основная гарантия:

**компрометации Main DB самой по себе недостаточно для расшифровки чувствительного пользовательского содержимого.**

Дополнительно система должна:

- обнаруживать модификацию ciphertext;
- не хранить пароли обратимо;
- переживать потерю одной share;
- поддерживать key rotation;
- позволять контролируемый user recovery;
- позволять disaster recovery после полной потери VPS при наличии off-server operator secret.

## 3. Обязательные инварианты

1. Main DB не содержит полного набора материалов для decrypt sensitive data.
2. Один пользовательский DEK не decrypt-ит данные другого пользователя.
3. Одна share не восстанавливает KRK.
4. Любые корректные 2-of-3 share восстанавливают KRK.
5. Passwords хэшируются Argon2id с уникальной солью и не хранятся обратимо.
6. AES-GCM integrity failure никогда не возвращает plaintext.
7. Plaintext DEK не персистится в Main DB, disk cache или logs.
8. Ordinary Backend не имеет прямого доступа к KRK/KEK/share storage и maintenance interface.
9. Disaster backup не хранит assembled KRK.
10. Object storage alone не должно содержать достаточного материала для восстановления key hierarchy.

## 4. Общая архитектура

```text
Internet
   │
Backend (Linux user: backend)
   │
   ├── Main DB
   │    ├── open technical metadata
   │    ├── encrypted sensitive payload
   │    └── wrapped DEK + crypto metadata
   │
   └── /run/keyservice/backend.sock
                 │
         Key/Recovery Service
         (Linux user: keyservice)
                 │
          ┌──────┼──────┐
          │      │      │
       Share A Share B Share C
        Store    Store  PNG 256×256
          │      │      │
          └──── 2 of 3 ─┘
                 │
                KRK
                 │
          wrapped KEK versions
                 │
          wrapped user DEKs
```

Privileged operations:

```text
maintenance context
      │
/run/keyservice/maintenance.sock
      +
off-server maintenance-secret
      ↓
rotation / reissue / revoke / disaster recovery
```

## 5. Ключевая иерархия

### KRK
- Random 256-bit root key.
- Делится Shamir Secret Sharing 2-of-3 через проверенную библиотеку.
- Shares: A, B, C.

### KEK
- Versioned/generational.
- Persistent KEK state хранится только wrapped под KRK.
- Новая версия сразу применяется к новым операциям.

### DEK
- Один random 256-bit DEK на пользователя.
- DEK хранится только wrapped под конкретной KEK version.
- DEK encrypt-ит sensitive records данного пользователя.

```text
KRK
 ├─ Share A
 ├─ Share B
 └─ Share C
  │
  └─ wraps KEK v1..vN
        │
        └─ wraps DEK per user
              │
              └─ AES-256-GCM user records
```

## 6. Шифрование пользовательских данных

- Algorithm: AES-256-GCM.
- Один sensitive logical record = один authenticated encrypted payload.
- Nonce: 96-bit CSPRNG, уникальный для каждой encryption operation с тем же DEK.
- Tag: 128-bit.
- AAD связывает ciphertext минимум с:
  - `user_id`;
  - `record_id`;
  - `record_type`;
  - `crypto_schema_version`.

Main DB может хранить открытые технические поля, необходимые для routing/lookup, если они сами не являются sensitive content.

## 7. Wrapping DEK

DEK wrapped под KEK через AES-256-GCM.

Stored metadata:

- `dek_id`;
- `wrapped_dek`;
- `wrap_nonce`;
- `wrap_tag`;
- `kek_version`.

AAD:

`user_id + dek_id + kek_version`

Plaintext DEK в Main DB не сохраняется.

## 8. Share storage

На одном физическом VPS используются отдельные local storage contexts:

- Share A Store;
- Share B Store;
- Image Share C Store.

Каждый контур использует отдельные credentials/access permissions.

Main DB не содержит shares.

Normal path использует A+B.

A+C или B+C — аварийные комбинации.

## 9. Image Share C

- Carrier: exact PNG 256×256.
- Share C сначала encrypt-ится.
- Random `carrier_key`.
- HKDF-SHA-256 выводит:
  - `K_enc` — encryption;
  - `K_map` — pseudorandom mapping.
- `K_enc` encrypt-ит Share C AES-256-GCM.
- `K_map` определяет sparse RGB/LSB positions.
- Alpha не используется.
- Хранится SHA-256 checksum exact PNG.
- Запрещены resize/JPEG/re-save/optimizer.
- Пользователь PNG не получает.

Steganography — дополнительное сокрытие, не самостоятельная security boundary.

## 10. Process isolation

### Backend
Linux account: `backend`.

Может:
- обращаться к `backend.sock`;
- получать permitted user DEK;
- шифровать/расшифровывать sensitive payload.

Не может:
- читать Key Service secret storage;
- читать A/B/C напрямую;
- подключаться к `maintenance.sock`.

### Key/Recovery Service
Linux account: `keyservice`.

Отвечает за:
- reconstruction KRK;
- KEK unwrap/wrap;
- DEK unwrap;
- rotation/revoke;
- recovery;
- disaster key restoration.

Key Service не публикует key-management TCP API в интернет.

## 11. Unix Socket interfaces

### `/run/keyservice/backend.sock`

Allowed:
- create DEK for a new user;
- get DEK for a permitted user operation;
- status/error.

Controls:
- caller/session context;
- per-user/global rate limiting;
- audit without secrets/plaintext;
- anti-enumeration.

Forbidden:
- raw KRK/KEK/share read;
- generic decrypt/wrap/unwrap oracle;
- rotation/reissue;
- maintenance recovery.

### `/run/keyservice/maintenance.sock`

Недоступен `backend`.

Используется для:
- KEK rotation;
- KRK/share reissue;
- revoke/replace key material;
- emergency/disaster operations.

Требует отдельной maintenance authorization.

## 12. Maintenance secret

- Random 256-bit secret.
- Хранится у owner/operator вне web application.
- В live service для authentication хранится только verifier.
- Не хранится в Main DB и object storage в открытом виде.
- Используется также как off-server root для disaster-unlock derivation через domain-separated HKDF.

## 13. User recovery V1

Factors:
- verified email;
- один unused one-time Recovery Code.

Recovery Codes:
- 10 codes;
- CSPRNG;
- server stores only one-way verifiers;
- показ один раз;
- каждый code one-time;
- новый набор создаётся вручную;
- новый набор инвалидирует весь старый;
- после recovery новый code автоматически не выдаётся.

Email token и recovery authorization — short-lived (ориентир ~15 минут).

Password reset сам по себе не даёт data-recovery.

Recovery rate-limited; start/success сопровождаются notification.

## 14. Passwords

- Argon2id.
- Unique random salt per password.
- Work factor хранится вместе с hash и может повышаться.
- Стартовые параметры из рабочего дизайна: `m=19 MiB, t=2, p=1`, затем benchmark upward на фактическом VPS.
- Password никогда не encrypt-ится обратимо.

## 15. DEK cache и outage

Backend:
- plaintext DEK cache только в RAM;
- TTL <= 5 минут;
- no disk persistence;
- rotation/revoke/security invalidate удаляет запись немедленно.

Key Service outage:
- existing cached DEK действует только до исходного expiry;
- TTL не продлевается;
- new DEK не выдаются;
- после cache expiry affected encrypted operations fail closed.

## 16. Rotation

### KEK rotation
1. Generate `KEK vN+1`.
2. Wrap under KRK.
3. New operations use vN+1.
4. Old wrapped DEKs lazy-rewrap при следующем обращении.
5. Старый KEK удаляется только когда ссылок на него больше нет и backup подтверждён.

### KRK/share compromise
1. Получить разрешённые 2-of-3 old shares.
2. Reconstruct old KRK.
3. Generate new KRK.
4. Rewrap KEKs.
5. Generate A2/B2/C2.
6. Regenerate PNG C2.
7. Atomic activate new keyset.
8. Invalidate old keyset.

### User DEK compromise
1. Generate new DEK.
2. Re-encrypt sensitive records конкретного пользователя.
3. Replace wrapped DEK.
4. Invalidate old DEK.

## 17. User-data backup

- Separate provider object storage.
- Frequency: once per day.
- Retention: 7 versions.
- Backup contains only encrypted user content plus required crypto metadata/wrapped DEKs.
- No plaintext sensitive user data.
- Expected rollback window при restore from scheduled backup: до ~24 часов.

## 18. Disaster recovery ключевого контура

### Backup Recovery Key (BRK)

Отдельный random 256-bit BRK защищает disaster-recovery materials:

- serialized Share A backup;
- serialized Share B backup;
- serialized Share C backup;
- keyset/version metadata;
- recovery metadata;
- carrier metadata/`carrier_key`, если требуется exact restoration старого PNG.

Каждый backup object encrypt-ится authenticated encryption под BRK с отдельным nonce/AAD.

### BRK bootstrap

BRK хранится:
- в live Key Service secret storage для автоматических backups;
- в object storage только wrapped.

Для wrapping BRK:

```text
off-server maintenance-secret
   ↓ HKDF-SHA-256
label = "backup-recovery-wrap"
   ↓
K_BRK_WRAP
   ↓
AES-256-GCM wrap(BRK)
```

Object storage хранит:
- wrapped BRK;
- nonce/tag;
- derivation context/version metadata.

Maintenance-secret не хранится там.

### Полная потеря VPS

```text
new VPS
 ↓
restore encrypted data/object backup
 ↓
operator supplies maintenance-secret
 ↓
derive K_BRK_WRAP
 ↓
unwrap BRK
 ↓
decrypt A/B/C backups
 ↓
any 2 shares -> KRK
 ↓
unwrap KEKs
 ↓
unwrap user DEKs
 ↓
restore encrypted service
```

Share C PNG:
- может быть восстановлен exact из backup при наличии encrypted carrier metadata;
- либо безопасно пересоздан из restored Share C с новым carrier_key.

Собранный KRK никогда не сохраняется в disaster backup.

## 19. Integrity failure

При AES-GCM authentication failure:

1. plaintext не возвращается;
2. создаётся integrity/security event;
3. система проверяет backup versions от новых к старым;
4. восстанавливает newest cryptographically valid copy;
5. если valid copy нет — только affected record становится unavailable.

Пользователю не раскрываются nonce/tag/key internals.

## 20. Проверяемые гарантии

Автоматически проверить:

- Main DB dump не содержит plaintext sensitive data/DEK/KEK/KRK/share.
- AES-GCM round-trip.
- tampered ciphertext/nonce/tag/AAD fails.
- nonce reuse не возникает в generated test corpus.
- один share не reconstruct-ит KRK.
- A+B, A+C, B+C reconstruct KRK.
- Linux `backend` не читает Key Service secrets.
- `backend` не подключается к `maintenance.sock`.
- DEK cache expires <= 5 min.
- user Recovery Code one-time.
- daily backup retention = 7.
- BRK-wrapped disaster backup восстанавливается с correct maintenance-secret.
- object storage без maintenance-secret не может unwrap BRK.
- full disaster test: backup -> new environment -> BRK -> shares -> KRK -> KEK -> DEK -> data.

Human/combined:
- проверить фактические Linux users/groups/permissions на Beget;
- провести disposable full disaster recovery;
- подтвердить acceptable recovery UX;
- проверить operational хранение off-server maintenance-secret.

## 21. Риски и ограничения

1. Full root compromise live VPS может получить live key material и находится вне гарантии.
2. Рабочие A/B/C на одном VPS дают logical isolation, не physical-host isolation.
3. Потеря off-server maintenance-secret одновременно с полной потерей VPS делает disaster key recovery невозможным.
4. PNG steganography не заменяет encryption.
5. Key Service outage > DEK-cache TTL блокирует новые encrypted operations.
6. Full-text search по encrypted sensitive content не входит в V1.
7. Daily backup допускает до ~24 часов rollback при полном disaster restore.

## 22. Сознательно отложено

- TOTP/passkey/phone и другие recovery factors.
- Encrypted full-text search.
- Multiple physical key servers/HSM.

## 23. Некритичные implementation вопросы

Следующий этап может определить без изменения архитектуры:

- конкретные численные rate limits;
- конкретный local storage engine для A/B;
- exact wire format внутренних socket messages;
- deployment-specific filesystem paths;
- operational формат резервного хранения maintenance-secret.

## 24. Итоговая схема

```text
USER DATA:
Backend
  ↓ AES-256-GCM with user DEK
Main DB ciphertext

KEY PATH:
A + B (or A+C / B+C)
  ↓
KRK
  ↓
KEK version
  ↓
user DEK

DISASTER PATH:
off-server maintenance-secret
  ↓
K_BRK_WRAP
  ↓
wrapped BRK in object storage
  ↓
BRK
  ↓
encrypted A/B/C backups
  ↓
KRK -> KEK -> DEK -> encrypted data
```

## 25. Статус

Технический проект готов для следующего этапа реализации.

Критичных незакрытых архитектурных вопросов в текущем scope нет.
