# Versioning

Questo documento spiega il sistema di versioning adottato in **travel-trackr**, cosa rappresenta ogni numero di versione e come il processo è automatizzato.

---

## Cos'è il Versioning

Il versioning è il sistema con cui si assegna un identificatore univoco a ogni rilascio del software. Serve a:

- Comunicare chiaramente **cosa è cambiato** tra una versione e la precedente.
- Permettere a chi usa o manutiene il progetto di capire **l'entità delle modifiche** (bug fix, nuova feature, breaking change).
- Fornire una storia tracciabile dell'evoluzione del software.

---

## Semantic Versioning (SemVer)

Questo progetto adotta lo standard **Semantic Versioning**, detto anche **SemVer**, nella forma:

```
MAJOR.MINOR.PATCH
```

| Componente | Quando aumenta | Esempio |
|---|---|---|
| **MAJOR** | Modifiche incompatibili con le versioni precedenti (*breaking changes*) | `1.0.0` → `2.0.0` |
| **MINOR** | Nuove funzionalità retrocompatibili | `1.2.0` → `1.3.0` |
| **PATCH** | Bug fix retrocompatibili | `1.3.0` → `1.3.1` |

La versione attuale del progetto è visibile nel campo `"version"` di [package.json](../package.json) e nei tag Git (`v1.3.0`).

### Esempi concreti dal progetto

| Versione | Tipo | Contenuto |
|---|---|---|
| `1.0.0` | — | Prima release stabile |
| `1.1.0` | MINOR | Aggiunta sezione travel |
| `1.2.0` | MINOR | Controlli e dati tecnici per attività (es. trekking) |
| `1.3.0` | MINOR | Auto-approve delle release PR su GitHub Actions |

---

## Conventional Commits

Il versioning automatico si basa sul formato dei messaggi di commit, seguendo la convenzione **Conventional Commits**:

```
<tipo>(<scope>): <descrizione breve>
```

I tipi riconosciuti e il loro effetto sulla versione:

| Tipo di commit | Effetto sulla versione |
|---|---|
| `feat: ...` | MINOR bump (`1.2.0` → `1.3.0`) |
| `fix: ...` | PATCH bump (`1.3.0` → `1.3.1`) |
| `feat!: ...` oppure `BREAKING CHANGE` nel corpo | MAJOR bump (`1.3.0` → `2.0.0`) |
| `chore:`, `docs:`, `refactor:`, `test:`, `ci:` | Nessun bump di versione |

### Esempi di commit

```bash
# Aggiunge una nuova feature → MINOR
git commit -m "feat(travel): aggiunta esportazione viaggi in PDF"

# Corregge un bug → PATCH
git commit -m "fix(user): corretto errore nel reset della password"

# Breaking change → MAJOR
git commit -m "feat!: rimossa autenticazione con sessione, solo JWT"

# Nessun bump (manutenzione)
git commit -m "chore: aggiornate dipendenze npm"
git commit -m "docs: aggiornato README"
```

---

## Automazione con Release Please

Il processo di rilascio è completamente automatizzato tramite [Release Please](https://github.com/googleapis/release-please), configurato in [release-please-config.json](../release-please-config.json) e attivato dal workflow [.github/workflows/release.yml](../.github/workflows/release.yml).

### Come funziona

1. Ogni push su `main` analizza i commit dalla release precedente.
2. Release Please determina il tipo di bump (MAJOR / MINOR / PATCH) in base ai tipi di commit trovati.
3. Apre automaticamente una **Release PR** con:
   - La versione aggiornata in `package.json`.
   - Il `CHANGELOG.md` aggiornato con tutti i commit rilevanti.
4. La PR viene **auto-approvata e unita** tramite squash merge (comportamento configurato nel workflow).
5. Al merge, viene creato un **tag Git** nella forma `v1.3.0`.

### File coinvolti

| File | Ruolo |
|---|---|
| [release-please-config.json](../release-please-config.json) | Configura il tipo di release (`node`) e il nome del pacchetto |
| `.release-please-manifest.json` | Tiene traccia dell'ultima versione rilasciata (gestito automaticamente) |
| [CHANGELOG.md](../CHANGELOG.md) | Storico di tutte le release, aggiornato automaticamente |
| [package.json](../package.json) | Campo `version` aggiornato automaticamente ad ogni release |

---

## Flusso riassuntivo

```
Commit su main (feat/fix/...)
        │
        ▼
Release Please analizza i commit
        │
        ▼
Apre Release PR (version bump + CHANGELOG)
        │
        ▼
Auto-merge via squash
        │
        ▼
Tag Git creato (es. v1.4.0)
```

---

## Riferimenti

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Release Please](https://github.com/googleapis/release-please)
