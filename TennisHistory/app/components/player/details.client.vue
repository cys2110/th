<script setup lang="tsx">
const props = defineProps<{
  player: PlayerDetailsType
}>()
const playerStore = usePlayerStore()
const currentYear = new Date().getFullYear()

const details = computed(() => [
  {
    label: "Rankings",
    class: "row-span-2",
    value: (
      <div class="grid grid-rows-4 grid-flow-col gap-1 text-center">
        <div></div>
        <div class="font-semibold text-muted">Current</div>
        <div class="font-semibold text-muted">Career High</div>
        <div class="font-semibold text-muted">Date</div>
        <div class="font-semibold text-muted text-center">Singles</div>
        <div>{props.player?.current_singles ?? "—"}</div>
        <div>{props.player?.ch_singles ?? "—"}</div>
        <div>{props.player?.singles_ch_date ? useDateFormat(props.player.singles_ch_date as string, "DD MMMM YYYY").value : "—"}</div>
        <div class="font-semibold text-muted text-center">Doubles</div>
        <div>{props.player?.current_doubles ?? "—"}</div>
        <div>{props.player?.ch_doubles ?? "—"}</div>
        <div>{props.player?.doubles_ch_date ? useDateFormat(props.player.doubles_ch_date as string, "DD MMMM YYYY").value : "—"}</div>
      </div>
    )
  },
  ...(props.player.age ?
    [
      {
        label: "Age",
        value: (
          <div>
            <div>{props.player.age} years old</div>
            <div>
              {props.player.dob && props.player.dod ?
                dateTimeFormat.formatRange(new Date(props.player.dob), new Date(props.player.dod))
              : useDateFormat(props.player.dob, "DD MMMM YYYY").value}
            </div>
          </div>
        )
      }
    ]
  : []),
  ...(props.player.height ?
    [
      {
        label: "Height",
        value: (
          <div>
            {props.player.height}cm ({convertToFt(props.player.height)})
          </div>
        )
      }
    ]
  : []),
  ...(props.player.rh ?
    [
      {
        label: "Plays",
        value: <div>{props.player.rh}-handed</div>
      }
    ]
  : []),
  ...(props.player.bh ?
    [
      {
        label: "Backhand",
        value: <div>{props.player.bh}-handed</div>
      }
    ]
  : []),
  ...(props.player.turned_pro || props.player.retired ?
    [
      {
        label:
          props.player.turned_pro && props.player.retired ? "Pro Years"
          : props.player.turned_pro ? "Turned Pro"
          : "Retired",
        value: (
          <>
            <div>
              {props.player.turned_pro && props.player.retired ?
                `${props.player.turned_pro} - ${props.player.retired}`
              : props.player.turned_pro ?
                props.player.turned_pro
              : props.player.retired}
            </div>
            {props.player.turned_pro && (props.player.retired || playerStore.activeYears.includes(currentYear)) && (
              <div>{(props.player.retired || currentYear) - props.player.turned_pro + 1} years</div>
            )}
          </>
        )
      }
    ]
  : []),
  {
    label: "Career Prize Money",
    value: <div>{props.player?.pm?.toLocaleString("en-GB", { style: "currency", currency: "USD" })}</div>
  },
  ...(props.player.coaches.length || props.player.former_coaches.length ?
    [
      {
        label: "Coaches",
        class: `row-span${props.player.coaches.length + props.player.former_coaches.length}`,
        value: (
          <div>
            {props.player.coaches.map(coach => (
              <div
                class="flex items-center gap-2"
                key={coach.id}
              >
                <dev-only
                  v-slots={{
                    default: () => [
                      <person-update
                        type="Coach"
                        person={coach}
                      />,
                      coach.years && <span class="text-dimmed shrink-0">({coach.years})</span>
                    ],
                    fallback: () => [
                      coach.labels?.includes("Player") ?
                        <u-link
                          to={{ name: "player", params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }}
                          class="hover-link default-link"
                        >
                          {coach.first_name} {coach.last_name}
                        </u-link>
                      : <span>
                          {coach.first_name} {coach.last_name}
                        </span>,
                      coach.years && <span class="text-dimmed shrink-0">({coach.years})</span>
                    ]
                  }}
                />
              </div>
            ))}
            {props.player.former_coaches.map(coach => (
              <div
                class="flex items-center gap-2"
                key={coach.id}
              >
                <dev-only
                  v-slots={{
                    default: () => [
                      <person-update
                        type="Coach"
                        person={coach}
                      />,
                      coach.years && <span class="text-dimmed shrink-0">({coach.years})</span>
                    ],
                    fallback: () => [
                      coach.labels?.includes("Player") ?
                        <u-link
                          to={{ name: "player", params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }}
                          class="hover-link default-link"
                        >
                          {coach.first_name} {coach.last_name}
                        </u-link>
                      : <span>
                          {coach.first_name} {coach.last_name}
                        </span>,
                      coach.years && <span class="text-dimmed shrink-0">({coach.years})</span>
                    ]
                  }}
                />
              </div>
            ))}
          </div>
        )
      }
    ]
  : []),
  ...(props.player.former_countries.length ?
    [
      {
        label: "Previous Representations",
        class: `row-span${props.player.former_countries.length}`,
        value: (
          <div>
            {props.player.former_countries.map(country => (
              <div
                key={country.id}
                class="flex items-center gap-2"
              >
                <country-link country={country} />
                {country.start_date && country.end_date && (
                  <span class="text-dimmed">
                    ({dateTimeFormat.formatRange(new Date(country.start_date as string), new Date(country.end_date as string))})
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      }
    ]
  : []),
  ...(props.player.hof ?
    [
      {
        label: "Hall of Fame Induction",
        value: <div>{props.player.hof}</div>
      }
    ]
  : [])
])
</script>

<template>
  <details-grid>
    <div
      v-for="detail in details"
      :key="detail.label"
      :class="detail.class"
    >
      <div>{{ detail.label }}</div>
      <component :is="detail.value" />
    </div>
  </details-grid>
</template>
