import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(dir, "../src/seed-data/worker-demo.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const threshold = { laag: "low", midden: "medium", hoog: "high", onbekend: "unknown" };

const stringMap = {
  // sources — reasons / notes
  "Officiële basisregistratie van alle Nederlandse ondernemingen.":
    "Official base registry of all Dutch companies.",
  "Gouden standaard voor bedrijfsbestaan.": "Gold standard for company existence.",
  "Digitale vindbaarheid en reviews, maar gevoelig voor manipulatie.":
    "Digital discoverability and reviews, but easy to manipulate.",
  "Niet als trusted beschouwen zonder extra verificatie.":
    "Do not treat as trusted without extra verification.",
  "Lokaal netwerk van actieve bedrijven in de regio.":
    "Local network of active companies in the region.",
  "Weight verlaagd van 80 naar 65 vanwege beperkte lokale dekking.":
    "Weight lowered from 80 to 65 due to limited local coverage.",
  "Deelnemers aan vakbeurs tonen professionele ambitie.":
    "Trade-fair exhibitors show professional ambition.",
  "Lage weight geaccepteerd; eenmalige deelname zonder strenge screening.":
    "Low weight accepted; one-off participation without strict screening.",
  "Lokale media-aandacht kan duiden op bestaansrecht.":
    "Local media attention can indicate real-world presence.",
  "Wacht op koppeling van specifieke bedrijfsvermeldingen.":
    "Waiting for linkage of specific company mentions.",
  "Lokaal netwerk van ondernemers die elkaar aanbevelen.":
    "Local network of entrepreneurs who refer each other.",
  "Wacht op formele goedkeuring van de chapter-list.":
    "Waiting for formal approval of the chapter list.",
  "Onafhankelijke brancheorganisatie voor consumenten en vakmensen.":
    "Independent trade organisation for consumers and craftspeople.",
  "Gerenommeerde landelijke bond.": "Well-regarded national association.",
  "Kwaliteitsorganisatie met strenge toelatingseisen en periodieke audits.":
    "Quality organisation with strict admission rules and periodic audits.",
  "Hét keurmerk in schilderend Nederland.": "The leading quality mark for painters in the Netherlands.",
  "Automatisch gegenereerde directory, mogelijk SEO-farm.":
    "Auto-generated directory, possible SEO farm.",
  "Afgewezen wegens gebrek aan real-world presence en jonge domeinleeftijd.":
    "Rejected for lack of real-world presence and young domain age.",
  "Lokaal initiatief voor samenwerking tussen zelfstandige schilders.":
    "Local initiative for cooperation among independent painters.",
  "Wacht op audit van de ledenlijst voordat deze trusted wordt.":
    "Waiting for member-list audit before treating as trusted.",

  // evidence host / notes / ages
  "Rijksoverheid hosting": "Dutch government hosting",
  "Wettelijk verplichte registratie": "Legally required registration",
  "Officieel overheidsorgaan": "Official government body",
  "Platform is betrouwbaar, individuele profielen niet per se":
    "Platform is reliable; individual profiles are not necessarily",
  "Platformniveau betrouwbaar, entry-level verificatie":
    "Reliable at platform level; entry-level verification only",
  "Nederlandse hosting": "Dutch hosting",
  "Actieve vereniging met ledenlijst": "Active association with member list",
  "Regelmatige bijeenkomsten in Hoofddorp": "Regular meetings in Hoofddorp",
  "Professionele hosting": "Professional hosting",
  "Officiële beursorganisatie": "Official fair organiser",
  "Groot jaarlijks fysiek event": "Large annual physical event",
  "Professionele nieuwsuitgave": "Professional news publisher",
  "Grote regionale krant": "Major regional newspaper",
  "Strikte lidmaatschapseisen per chapter": "Strict membership requirements per chapter",
  "Wekelijkse bijeenkomsten": "Weekly meetings",
  "Duidelijke statuten en ledenregister": "Clear statutes and member register",
  "Actieve belangenbehartiging": "Active advocacy",
  "SSL valide, Nederlandse hosting": "Valid SSL, Dutch hosting",
  "Duidelijke toelatingseisen, jaarlijkse hercertificering":
    "Clear admission rules, annual re-certification",
  "Actieve kwaliteitsorganisatie met fysieke bijeenkomsten":
    "Active quality organisation with in-person meetings",
  "GoDaddy, privacy protected": "GoDaddy, privacy protected",
  "Generieke teksten, geen specifieke bedrijfsinfo, veel externe affiliate links":
    "Generic copy, no specific company info, many external affiliate links",
  "Geen enkel spoor van fysieke activiteiten of vermeldingen buiten eigen site":
    "No trace of physical activity or mentions outside its own site",
  "Lokale initiatief, lijst is compleet maar mist formele audit":
    "Local initiative; list is complete but lacks a formal audit",
  "Lokale netwerkbijeenkomsten in Hoofddorp": "Local networking meetings in Hoofddorp",
  onbekend: "unknown",
  "sinds 1925": "since 1925",
  "sinds 2010": "since 2010",
  "sinds 1999": "since 1999",
  "sinds 1893": "since 1893",
  "sinds 1985": "since 1985",
  "sinds 2008": "since 2008",
  "sinds 2021": "since 2021",
  "n.v.t.": "n/a",
  "25+ jaar": "25+ years",
  "20+ jaar": "20+ years",
  "15 jaar": "15 years",
  "10 jaar": "10 years",
  "8 jaar": "8 years",
  "3 jaar": "3 years",
  "4 maanden": "4 months",

  // summary_reasons
  "✓ Wettelijke basisregistratie": "✓ Legal base registry",
  "✓ Hoge betrouwbaarheid": "✓ High reliability",
  "✓ Groot platform": "✓ Large platform",
  "✗ Individuele claims vaak ongeverifieerd": "✗ Individual claims often unverified",
  "✓ Actieve lokale vereniging": "✓ Active local association",
  "✓ Fysieke bijeenkomsten": "✓ In-person meetings",
  "? Ledenlijst niet altijd 100% actueel": "? Member list not always 100% current",
  "✓ Gerenommeerde beurs": "✓ Well-known trade fair",
  "✗ Deelname garandeert geen kwaliteitsniveau":
    "✗ Participation does not guarantee quality",
  "✓ Betrouwbare uitgever": "✓ Reliable publisher",
  "? Bedrijfsvermeldingen zijn vaak betaald of oppervlakkig":
    "? Company listings are often paid or shallow",
  "✓ Strikte toegangseisen": "✓ Strict admission barriers",
  "✓ Actieve lokale community": "✓ Active local community",
  "? Ledenlijst niet altijd publiek": "? Member list not always public",
  "✓ Erkenning in de branche": "✓ Recognised in the trade",
  "✓ Toetsing van lid-bedrijven": "✓ Vetting of member companies",
  "✓ Gerenommeerd landelijk keurmerk": "✓ Well-regarded national quality mark",
  "✓ Strenge toelatingseisen en periodieke audits":
    "✓ Strict admission rules and periodic audits",
  "✗ Domeinregistratie < 6 maanden": "✗ Domain registered < 6 months ago",
  "✗ Geen KvK-gegevens vindbaar": "✗ No KvK details found",
  "✗ Typische affiliate/linkfarm structuur": "✗ Typical affiliate / link-farm structure",
  "✗ Geen real-world presence": "✗ No real-world presence",
  "✓ Lokaal bekend initiatief": "✓ Locally known initiative",
  "✓ Actieve LinkedIn en Facebook pagina": "✓ Active LinkedIn and Facebook pages",
  "? Mist formele onafhankelijke audit voor 'trusted' status":
    "? Lacks formal independent audit for trusted status",

  // reviews
  "Basisregistratie, betrouwbaar en wettelijk verplicht.":
    "Base registry — reliable and legally required.",
  "Weight aangepast naar 65 omdat lokale dekking in Haarlemmermeer beperkter is dan landelijk.":
    "Weight adjusted to 65 because local coverage in Haarlemmermeer is thinner than national.",
  "Domein <6 maanden oud, geen fysiek adres, typische linkfarm structuur.":
    "Domain <6 months old, no physical address, typical link-farm structure.",
  "Gerenommeerd keurmerk met strenge toelatingseisen en periodieke audits.":
    "Well-regarded quality mark with strict admission rules and periodic audits.",
  "Lage weight geaccepteerd; het is een eenmalige beursdeelname zonder strenge screening.":
    "Low weight accepted; one-off fair participation without strict screening.",
  "Komt overeen met alle trusted bronnen, sterke lokale reputatie.":
    "Matches all trusted sources; strong local reputation.",
  "Score omlaag aangepast; recente wisseling van eigenaar is nog niet verwerkt in KvK.":
    "Score adjusted down; recent ownership change not yet reflected in KvK.",
  "Blacklist flag toegevoegd na meerdere meldingen van oplichting via nep-facturen.":
    "Blacklist flag added after multiple reports of fraud via fake invoices.",

  // valueTags
  betrouwbaarheid: "reliability",
  officieel: "official",
  lokale_nuance: "local_nuance",
  risico: "risk",
  seo_farm: "seo_farm",
  kwaliteit: "quality",
  keurmerk: "quality_mark",
  evenement: "event",
  laag_risico: "low_risk",
  top_performer: "top_performer",
  wijziging: "change",
  monitoring: "monitoring",
  fraude: "fraud",
  blocklist: "blocklist",

  // list_membership / misc
  "BouwBeurs 2024": "BouwBeurs 2024",
  "nep_facturen": "fake_invoices",
};

function translateString(s) {
  if (typeof s !== "string") return s;
  if (Object.hasOwn(stringMap, s)) return stringMap[s];
  if (Object.hasOwn(threshold, s)) return threshold[s];
  return s;
}

function walk(node) {
  if (typeof node === "string") return translateString(node);
  if (Array.isArray(node)) return node.map(walk);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "membership_threshold" && typeof v === "string") {
        out[k] = threshold[v] ?? v;
      } else {
        out[k] = walk(v);
      }
    }
    return out;
  }
  return node;
}

const translated = walk(data);

// Spot-check remaining Dutch-ish tokens (rough)
const blob = JSON.stringify(translated);
const suspects = [
  "Officiële",
  "Gouden",
  "Digitale",
  "Lokaal netwerk",
  "Afgewezen",
  "Wacht op",
  "Gerenommeerd",
  "Basisregistratie",
  "Weight aangepast",
  "Score omlaag",
  "Blacklist flag toegevoegd",
  '"laag"',
  '"midden"',
  '"hoog"',
  '"onbekend"',
];
for (const t of suspects) {
  if (blob.includes(t)) console.warn("Still present:", t);
}

writeFileSync(file, `${JSON.stringify(translated, null, 2)}\n`);
console.log("Translated", file);
