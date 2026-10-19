# PHASE 2.2 — Обобщение технического проекта

## Что в итоге получилось

Спроектирована practical envelope-encryption система для чувствительных пользовательских данных на одном Beget VPS.

У каждого пользователя отдельный DEK. DEK хранится только wrapped под versioned KEK. KEK защищены отдельным 256-bit root key KRK. KRK разделён Shamir 2-of-3 на Share A/B/C. Share C дополнительно шифруется и помещается в server-side PNG 256×256 как cold/emergency carrier.

Обычный Backend отделён от Key/Recovery Service Linux permissions и Unix Socket интерфейсами. Main DB сама по себе не содержит достаточного материала для расшифровки sensitive payload.

Disaster recovery ключевого контура закрыт через отдельный Backup Recovery Key (BRK), который защищает резервные A/B/C и key-recovery metadata. BRK в disaster storage хранится только wrapped ключом, производным от off-server maintenance-secret. Поэтому полная потеря VPS не делает key backups бесполезными.

## Основной поток

```text
User
 ↓
Backend
 ↓ backend.sock
Key/Recovery Service
 ↓
Share A + Share B
 ↓
KRK
 ↓
KEK version
 ↓
user DEK
 ↓
Backend RAM cache <= 5 min
 ↓
AES-256-GCM sensitive payload
 ↓
Main DB ciphertext
```

Share C/PNG не используется в normal hot path.

## Disaster recovery

```text
Object Storage
 ├─ encrypted Main DB/data backup
 ├─ encrypted A/B/C backups under BRK
 ├─ encrypted key-recovery metadata under BRK
 └─ wrapped BRK
          ↑
off-server maintenance-secret
          ↓ HKDF
      K_BRK_WRAP
```

После полной потери VPS оператор с maintenance-secret unwrap-ит BRK, восстанавливает A/B/C, затем KRK -> KEK -> DEK.

## Ключевые решения

- Один DEK на пользователя.
- Versioned KEK + lazy rotation.
- KRK 256-bit, Shamir 2-of-3.
- AES-256-GCM для sensitive data и DEK wrapping.
- Один Beget VPS.
- Отдельные local storage contexts для A/B/C.
- Share C — encrypted PNG 256×256.
- Backend и Key Service — разные Linux service accounts.
- Два Unix Socket: `backend.sock` и `maintenance.sock`.
- DEK cache — RAM only, TTL 5 минут.
- User recovery V1 — verified email + unused one-time Recovery Code.
- 10 one-time Recovery Codes.
- User-data backup — 1 раз в сутки, 7 версий.
- Disaster key backups — encrypted under BRK.
- BRK disaster bootstrap — wrapped via off-server maintenance-secret.

## Гарантии

При корректной реализации:

- Main DB dump alone недостаточен для decrypt sensitive data.
- Одна share недостаточна для KRK.
- Любые две корректные share восстанавливают KRK.
- Повреждение AES-GCM ciphertext/nonce/tag/AAD обнаруживается.
- Backend не имеет прямого доступа к KRK/KEK/share storage и `maintenance.sock`.
- Plaintext DEK не персистится.
- Потеря одной share переживается.
- Полная потеря рабочего VPS может быть восстановлена из object backups при наличии off-server maintenance-secret.

## Ограничения

- Full root compromise live VPS остаётся вне гарантии.
- Все рабочие A/B/C находятся на одном физическом VPS: это логическая, а не host-level изоляция.
- PNG hiding не является криптографической гарантией.
- Потеря off-server maintenance-secret одновременно с полной потерей VPS делает disaster key recovery невозможным.
- Full-text search по sensitive ciphertext не входит в V1.
- При outage Key Service после истечения 5-минутного cache новые encrypted operations fail closed.
- Daily backup оставляет до ~24 часов rollback window.

## Отложено

- дополнительные recovery factors (TOTP/passkey/phone);
- encrypted full-text search;
- физическое разделение key material по нескольким серверам/HSM.

## Незакрытые вопросы

Критичных незакрытых вопросов нет.

Некритичные implementation-details:
- конкретные численные rate limits;
- конкретный local storage engine для A/B;
- точная operational-процедура хранения резервных копий off-server maintenance-secret.

# СТАТУС

## ГОТОВО К ФИНАЛИЗАЦИИ
