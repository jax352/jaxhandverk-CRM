# Jax Handverk CRM — vinna í skýinu með Codex og Claude

## Codex Cloud — bæta verkefninu við umhverfalistann

Þessi geymsla er einnig undirbúin fyrir Codex Cloud. Opnaðu **Settings → Codex Cloud → Environments**. Ef `jaxhandverk-CRM` er þegar til, veldu **… → Edit**; annars **Create environment**, veldu `jax352/jaxhandverk-CRM` og **Get started**. Haltu aðgangi **Private / Only me**.

Beiðni í uppsetningarsamtali:

> Settu þetta verkefni upp fyrir skývinnu. Lestu AGENTS.md og CLOUD.md. Notaðu Node.js 22.13 eða nýrri og npm run cloud:setup sem uppsetningarskipun. Keyrðu npm run check, npm run build og npm run db:local með nýjum prufugagnagrunni. Varðveittu núverandi Sites-bindingar og notaðu eingöngu prufugögn. Undirbúðu umhverfið fyrir Publish.

Eftir prófun þarf að velja **Publish** eða **Republish**. **Unpublished** er drög og verður ekki valanlegt fyrir venjulega skývinnu fyrr en það hefur verið birt. Birting skýumhverfis birtir ekki sjálfkrafa vefinn og flytur ekki lifandi gagnagrunn.

Codex Cloud les AGENTS.md; Claude les CLAUDE.md. Bæði nota sama GitHub-kóðann. Veldu eitt umhverfi fyrir hverja geymslu til að halda verkefnunum skýrum í listanum. Opinberar leiðbeiningar: [Codex Cloud-umhverfi](https://learn.chatgpt.com/docs/environments/cloud-environments).


Viðskiptavinir, samskipti, verkefni og innflutningur reikninga. Geymslan er opinber. Kerfið byggir á Orkuland-grunni en hefur eigin gagnagrunn og eigin Sites-verkefni.

## Þrír hlutir sem vinna saman

| Hluti | Tilgangur |
| --- | --- |
| [GitHub](https://github.com/jax352/jaxhandverk-CRM) | Sameiginlegur frumkóði, útgáfusaga og breytingar |
| [Claude Code í skýinu](https://claude.ai/code) | Breyta og prófa kóða úr vafra eða Code-flipa í Claude-símaappinu |
| Núverandi Sites-hýsing | Nota lifandi kerfið með sömu gögnum úr tölvum og síma |

[Opna kerfið](https://jaxhandverk-crm.jonaxel.chatgpt.site/)

## Tengja Claude einu sinni

Opnaðu claude.ai/code, tengdu GitHub-reikninginn jax352 og veittu Claude GitHub App aðgang að þessari geymslu. Veldu Cloud-umhverfi með Trusted-netaðgangi svo npm geti sótt læstar pakkaversjónir. Veldu geymsluna og main. Þetta krefst áskriftar með Claude Code-skýaðgangi; sjá opinberar leiðbeiningar neðst.

Geymslan inniheldur CLAUDE.md og .claude/settings.json. SessionStart-hook setur upp pakkana í skýinu; uppsetning er endurtekin þegar læsingarskrá eða Node/kerfisgerð breytist. Þú þarft ekki þessa Mac-tölvu í gangi til að vinna í Claude Cloud.

Fyrsta beiðni til Claude:

> Lestu CLAUDE.md og CLOUD.md. Keyrðu uppsetningu, gerðaprófun og byggingu. Segðu mér hvað er tilbúið, hvað vantar og hvaða próf voru raunverulega keyrð. Unnið er með prufugögn; varðveittu núverandi Sites-hýsingu og lifandi gögn. Vinna fer á sérgrein og í pull request.

## Prófa verkefnið

```sh
npm run cloud:setup
npm run check
npm run build
```

Nýr prufugagnagrunnur og forskoðun:

```sh
npm run db:local
npm run dev
```

db:local notar aðeins staðbundinn gagnagrunn í .wrangler/state, skráir keyrðar migrations og endurkeyrir þær ekki. Byggja þarf fyrst. Ef eldri handkeyrður gagnagrunnur er til staðar stöðvast skipunin; samræma þarf þá gömlu migration-söguna sérstaklega. Hún eyðir engum gögnum. Hver þróunarsession hefur eigin prufugögn.

Forskoðun á localhost inni í Claude Cloud er prófunarþjónn fyrir Claude; localhost-slóðin opnast ekki sjálfkrafa í símanum þínum. Notaðu útgefna kerfið fyrir daglega vinnu. Sérstök sýnileg skýforskoðun þarf einkatengil með aðgangsstýringu. Ekki opna CRM með raunverulegum gögnum í almennan þróunargöng.

CRM-leiðirnar treysta á aðgangsstýringu hýsingarinnar. Áður en hýsing er flutt þarf að staðfesta innskráningu og réttindi á þjóninum fyrir raunveruleg viðskiptavinagögn.

## Halda áfram úr öðru tæki

Opnaðu sama Claude-skýverkefni á sama Claude-reikningi til að halda áfram samtalinu. Ef þú byrjar nýja session skaltu velja sömu GitHub-geymslu og réttu greinina. Biðjið Claude að commit-a og push-a vinnu áður en farið er í nýja session. Samtalið eitt og sér varðveitir ekki óvistaðan kóða í nýju umhverfi.

Á tölvu má einnig sækja geymsluna með Git:

```sh
git clone https://github.com/jax352/jaxhandverk-CRM.git
cd jaxhandverk-CRM
npm run cloud:setup
```

## Birting og gagnavarðveisla

GitHub-breyting birtist ekki sjálfkrafa á lifandi vefnum. Núverandi birting fer um Sites. Claude hefur ekki sjálfkrafa Sites-birtingaraðgang þótt GitHub sé tengt. Ef óskað er eftir sjálfvirkri GitHub-birtingu eða flutningi frá Sites þarf að undirbúa það sérstaklega með eigin aðgangsstýringu, D1/R2-bindingum og varðveislu gagna.

Raunverulegar færslur og skjöl eiga áfram að vera í sameiginlegri skýgeymslu svo sömu gögn sjáist á öllum tækjum. GitHub er ekki afrit af rekstrargagnagrunninum. Gagnagrunns- og skjalafritun þarf sjálfstæða lausn.

Opinberar heimildir: [Claude Code í skýinu](https://code.claude.com/docs/en/claude-code-on-the-web), [skýumhverfi og SessionStart-hook](https://code.claude.com/docs/en/cloud-environments).
