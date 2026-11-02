# cold-md - Claude Code plugin

The [cold.md](https://cold.md) suite: eleven skills and one `/cold` command that run cold outreach end to end from a `cold.md` file in your repo, and propose edits to that file from A/B results. Sending runs on [FoxReach](https://www.foxreach.io).

## Install

Inside Claude Code:

```
/plugin marketplace add foxreach/cold-md
/plugin install cold-md@cold-md
```

Or from a terminal: `curl -fsSL https://cold.md/install | bash`

The sending skills need the FoxReach CLI and an API key (Settings > API Keys in FoxReach):

```bash
pip install foxreach-cli
export FOXREACH_API_KEY=otr_...
```

Then, in your repo: `/cold init`.

## Skills

| Skill | What it does | FoxReach key |
|---|---|---|
| `cold-icp` | Builds `icp.md` from a URL or Q&A, validated by web search | optional |
| `cold-offer` | Competitor and market research, writes `offer.md` | no |
| `cold-leads` | CSV import or Lead Finder search, ICP scoring, verification, import | yes |
| `cold-research` | Per-lead research bundles for personalization experiments | no |
| `cold-draft` | Openers, bumps, breakups from `cold.md`; lint | no |
| `cold-send` | Campaign creation with pre-flight checks | yes |
| `cold-experiment` | Next A/B from the variable ladder | no |
| `cold-learn` | Per-variant stats, z-test, proposed `cold.md` diff | yes |
| `cold-triage` | Categorizes replies, drafts answers, sends on approval | yes |
| `cold-status` | Beliefs, running experiments, pending diffs | no |
| `cold-report` | Daily/weekly digest; `/cold audit <domain>` | yes |

Run `/cold` with no arguments for the full command list.

## License

MIT for the plugin, CC-BY-4.0 for the [spec](https://github.com/foxreach/cold-md/blob/main/spec/cold-md-v0.md).
