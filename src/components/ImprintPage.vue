<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { APP_VERSION, IMPRINT, type Imprint } from '@/config'

/** The operator comes from the environment, the prop is only for tests. */
const props = defineProps<{ imprint?: Imprint | null }>()
const operator = computed(() => (props.imprint === undefined ? IMPRINT : props.imprint))

const emit = defineEmits<{ close: [] }>()

interface Credit {
  name: string
  url: string
  note: string
}

/** Everything the map is built on or its data comes from. */
const CREDITS: Credit[] = [
  {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright',
    note: 'Kartendaten und Umrisse der Gewässer © OpenStreetMap-Mitwirkende, Open Database License (ODbL)',
  },
  {
    name: 'CARTO',
    url: 'https://carto.com/attributions',
    note: 'Kartenstile Positron und Dark Matter',
  },
  {
    name: 'Bayerische Vermessungsverwaltung',
    url: 'https://www.geodaten.bayern.de',
    note: 'Luftbilder (DOP20), Creative Commons Namensnennung 4.0 (CC BY 4.0)',
  },
  {
    name: 'Nominatim',
    url: 'https://nominatim.org',
    note: 'Koordinaten der Verkaufsstellen aus ihren Adressen',
  },
  { name: 'Leaflet', url: 'https://leafletjs.com', note: 'Kartenbibliothek, BSD-2-Clause-Lizenz' },
  { name: 'Vue', url: 'https://vuejs.org', note: 'Web-Framework, MIT-Lizenz' },
  {
    name: 'Figtree und Vollkorn',
    url: 'https://fontsource.org/fonts/figtree',
    note: 'Schriften, SIL Open Font License 1.1, direkt mit der Seite ausgeliefert',
  },
  {
    name: 'hejfish',
    url: 'https://www.hejfish.com',
    note: 'Preise und Regeln einiger Gewässer mit Online-Tageskarten',
  },
]
</script>

<template>
  <article class="detail imprint" aria-label="Impressum und Datenschutz">
    <button type="button" class="back-link" @click="emit('close')">
      <AppIcon name="arrow-left" :size="16" />Zurück zur Karte
    </button>

    <header class="detail-header">
      <div class="detail-title">
        <p class="eyebrow">Über diese Seite</p>
        <h1 class="serif">Impressum</h1>
      </div>
      <button type="button" class="icon-button close-button" aria-label="Schließen" @click="emit('close')">
        <AppIcon name="close" :size="18" :stroke-width="2.2" />
      </button>
    </header>

    <section class="about">
      <p>
        Die Angelkarte zeigt, an welchen Gewässern in Augsburg und Umgebung du mit einer Tageskarte angeln darfst. Zu
        jedem Gewässer findest du den Verein, die Preise, die Schonzeiten und wo du die Karte bekommst. Entstanden ist
        sie als privates Projekt für mich und ein paar Freunde. Sie ist nicht kommerziell und gehört zu keinem Verein.
      </p>
    </section>

    <section v-if="operator">
      <h2 class="section-title serif">Angaben gemäß § 5 DDG</h2>
      <address class="operator">
        {{ operator.name }}<br />
        {{ operator.street }}<br />
        {{ operator.city }}
      </address>
      <p>E-Mail: <a :href="`mailto:${operator.email}`">{{ operator.email }}</a></p>
    </section>

    <section>
      <h2 class="section-title serif">Alle Angaben ohne Gewähr</h2>
      <p>
        Gewässer, Preise, Schonzeiten und Verkaufsstellen sind sorgfältig zusammengetragen, können sich aber jederzeit
        ändern. Verbindlich sind immer die Bestimmungen und der Erlaubnisschein des jeweiligen Vereins. Wenn dir ein
        Fehler auffällt, freue ich mich über eine kurze Nachricht.
      </p>
    </section>

    <section>
      <h2 class="section-title serif">Datenschutz</h2>
      <p>
        Verantwortlich für diese Seite ist der oben genannte Betreiber. Die Seite setzt keine Cookies, nutzt
        kein Tracking und keine Analyse-Werkzeuge. Die Schriften werden mit der Seite ausgeliefert, es wird nichts von
        Google geladen.
      </p>

      <h3 class="sub-title">Hosting bei GitHub Pages</h3>
      <p>
        Die Seite liegt bei GitHub Pages, einem Dienst der GitHub Inc. in den USA. Beim Aufruf verarbeitet GitHub
        technisch notwendige Daten wie deine IP-Adresse, den Zeitpunkt und die aufgerufene Adresse, zum Beispiel um die
        Seite auszuliefern und vor Angriffen zu schützen. Dabei können Daten in die USA übertragen werden. Mehr dazu in
        der
        <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">Datenschutzerklärung von GitHub</a>.
      </p>

      <h3 class="sub-title">Kartenkacheln von CARTO</h3>
      <p>
        Die Hintergrundkarte lädt dein Browser direkt von CARTO. Dabei erhält CARTO deine IP-Adresse und technische
        Angaben zu deinem Browser. Ohne diese Anfrage lässt sich die Karte nicht anzeigen. Rechtsgrundlage ist das
        berechtigte Interesse an einer funktionierenden Karte (Art. 6 Abs. 1 lit. f DSGVO). Mehr dazu in der
        <a href="https://carto.com/privacy" target="_blank" rel="noopener">Datenschutzerklärung von CARTO</a>.
      </p>

      <h3 class="sub-title">Luftbilder der Bayerischen Vermessungsverwaltung</h3>
      <p>
        Erst wenn du das Luftbild einschaltest, lädt dein Browser die Bilder direkt von den Servern des Landesamts für
        Digitalisierung, Breitband und Vermessung in München. Dabei erhält das Landesamt deine IP-Adresse und
        technische Angaben zu deinem Browser. Rechtsgrundlage ist wieder das berechtigte Interesse (Art. 6 Abs. 1 lit. f
        DSGVO). Mehr dazu auf der
        <a href="https://www.ldbv.bayern.de" target="_blank" rel="noopener">Seite des Landesamts</a>.
      </p>

      <h3 class="sub-title">Dein Standort</h3>
      <p>
        Wenn du „Mein Standort“ antippst oder die Liste nach Entfernung sortierst, fragt dein Browser, ob er den
        Standort freigeben darf. Er wird nur in deinem Browser verwendet, um die Karte zu zentrieren und Entfernungen zu
        berechnen, und weder gespeichert noch übertragen.
      </p>

      <h3 class="sub-title">Gespeicherte Einstellung</h3>
      <p>
        Wenn du zwischen hellem und dunklem Design wechselst, merkt sich dein Browser die Wahl im lokalen Speicher. Sie
        bleibt auf deinem Gerät und wird nicht übertragen.
      </p>

      <h3 class="sub-title">Offline-Speicher</h3>
      <p>
        Damit die Karte auch ohne Netz funktioniert, legt dein Browser die Seite, die Gewässerdaten und die zuletzt
        angesehenen Kartenausschnitte in seinem Zwischenspeicher ab. Das bleibt auf deinem Gerät und wird nicht
        übertragen. Du kannst es jederzeit über die Website-Daten in den Einstellungen deines Browsers löschen.
      </p>

      <h3 class="sub-title">Links zu anderen Seiten</h3>
      <p>
        Der Button „Route“ öffnet Google Maps, außerdem gibt es Links zu den Seiten der Vereine und zu hejfish. Dort
        gelten die Datenschutzbestimmungen der jeweiligen Anbieter.
      </p>

      <h3 class="sub-title">Deine Rechte</h3>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner Daten sowie
        auf Widerspruch. Außerdem kannst du dich beim
        <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">Bayerischen Landesamt für Datenschutzaufsicht</a>
        beschweren.
      </p>
    </section>

    <section>
      <h2 class="section-title serif">Quellen und Lizenzen</h2>
      <p class="muted credits-intro">
        Die Angaben zu den Gewässern stammen von den Webseiten und Erlaubnisscheinen der Vereine und von den
        Verkaufsstellen. Die genaue Quelle steht bei jedem Gewässer.
      </p>
      <ul class="credits">
        <li v-for="credit in CREDITS" :key="credit.name">
          <a :href="credit.url" target="_blank" rel="noopener">{{ credit.name }}</a>
          <span class="credit-note">{{ credit.note }}</span>
        </li>
      </ul>
    </section>

    <p class="muted version">Angelkarte Version {{ APP_VERSION }}</p>
  </article>
</template>

<style scoped>
.imprint {
  font-size: 15px;
  line-height: 1.5;
}

.imprint section p {
  margin: 0 0 10px;
}

.imprint section p:last-child {
  margin-bottom: 0;
}

.about p {
  margin: 0;
  color: var(--text-2);
}

.operator {
  margin: 0 0 10px;
  font-style: normal;
}

.sub-title {
  margin: 16px 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.credits-intro {
  margin-bottom: 10px;
}

.credits {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.credits li {
  display: flex;
  flex-direction: column;
}

.credits a {
  font-weight: 600;
}

.credit-note {
  font-size: 13px;
  color: var(--text-2);
}
</style>
