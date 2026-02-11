import type React from "react"
import { YMaps, Map, Placemark } from "@iminside/react-yandex-maps"
// import styles from "./Maps.module.css"

const Maps: React.FC = () => {
  const defaultState = {
    center: [55.751574, 37.573856],
    zoom: 2.5,
  }

  return (
    <YMaps
      query={{
        apikey: import.meta.env.VITE_REACT_YANDEX_API_KEY,
        load: "package.full",
      }}
    >
      <Map
        defaultState={defaultState}
        style={{ height: "100vh", width: "100vw" }}
      >
        <Placemark geometry={[55.684758, 37.738521]} />
      </Map>
    </YMaps>
  )
}

export default Maps
