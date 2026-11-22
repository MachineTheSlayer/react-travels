import { useCallback, useEffect, useState } from "react"
import {
  AutoComplete,
  Button,
  DatePicker,
  Drawer,
  Form,
  Mentions,
  message,
  Radio,
  Rate,
  Tag,
  Typography,
} from "antd"
import type { RadioChangeEvent } from "antd"
import { EnvironmentOutlined, LoadingOutlined } from "@ant-design/icons"
import type { Dayjs } from "dayjs"
import { useAppDispatch, useAppSelector } from "../../../../app/hooks"
import {
  clearSelectedCity,
  clearSuggestions,
  fetchWeatherForCity,
  getCoordinatesForSuggestion,
  getSuggestions,
  saveCityToMap,
  selectCity,
  setSearchValue,
} from "../../store/slices/citySlice"
import type {
  CityData,
  YandexMapsApi,
  YandexSuggestion,
} from "../../store/types"
import styles from "./AppHeader.module.css"

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = AutoComplete

type AddTripDrawerProps = {
  open: boolean
  onClose: () => void
}

type TripFormValues = {
  city: string
  date: [Dayjs, Dayjs]
  showplace: string | string[]
  rating?: number
}

export const AddTripDrawer: React.FC<AddTripDrawerProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch()
  const [form] = Form.useForm<TripFormValues>()
  const [tripType, setTripType] = useState<1 | 2>(1)
  const [autoCompleteOpen, setAutoCompleteOpen] = useState(false)

  const {
    searchValue,
    suggestResults,
    isLoading,
    isSuggestLoading,
    selectedCity,
  } = useAppSelector(state => state.city)
  const { isApiLoaded } = useAppSelector(state => state.map)

  const hasQuery = searchValue.trim().length > 0

  // ✅ При закрытии сбрасываем форму и выбранный город
  useEffect(() => {
    if (!open) {
      form.resetFields()
      dispatch(clearSelectedCity())
      dispatch(clearSuggestions())
      dispatch(setSearchValue(""))
      setTripType(1)
      setAutoCompleteOpen(false)
    }
  }, [open, form, dispatch])

  const handleSearch = useCallback(
    (value: string) => {
      dispatch(setSearchValue(value))
      const ymaps = window.ymaps as YandexMapsApi | undefined
      if (!ymaps || !value.trim() || !isApiLoaded) return
      void dispatch(getSuggestions({ query: value, ymaps }))
    },
    [dispatch, isApiLoaded],
  )

  const handleSearchInternal = useCallback(
    (value: string) => {
      handleSearch(value)
      if (value.trim()) setAutoCompleteOpen(true)
    },
    [handleSearch],
  )

  const handleSelect = useCallback(
    async (value: string) => {
      const ymaps = window.ymaps as YandexMapsApi | undefined
      if (!ymaps) return
      const suggestion = suggestResults.find(s => s.value === value)
      if (!suggestion) return

      const result = await dispatch(
        getCoordinatesForSuggestion({ suggestion, ymaps }),
      ).unwrap()

      if (result) {
        dispatch(
          selectCity({
            name: result.value,
            coordinates: result.coordinates,
            fullAddress: result.fullAddress,
          }),
        )
        // ✅ фиксируем выбранный город в инпуте
        dispatch(setSearchValue(result.value))
        message.success(`Выбран город: ${result.value}`)
      }
    },
    [dispatch, suggestResults],
  )

  const handleTypeChange = useCallback(
    (e: RadioChangeEvent) => {
      setTripType(e.target.value as 1 | 2)
      form.resetFields()
    },
    [form],
  )

  const handleSave = useCallback(() => {
    if (!selectedCity) {
      message.warning("Сначала выберите город")
      return
    }

    const dateRange = form.getFieldValue("date") as [Dayjs, Dayjs] | undefined
    const rawPlaces = form.getFieldValue("showplace") as
      | string
      | string[]
      | undefined
    const rating = form.getFieldValue("rating") as number | undefined

    let places: string[] | undefined
    if (rawPlaces) {
      places = Array.isArray(rawPlaces)
        ? rawPlaces
        : rawPlaces.split(/[\n,]+/).filter(s => s.trim().length > 0)
    }

    const fullCityData: CityData = {
      ...selectedCity,
      tripType: tripType === 1 ? "planned" : "past",
      dateRange: dateRange
        ? [dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD")]
        : undefined,
      places: places && places.length > 0 ? places : undefined,
      rating: tripType === 2 ? rating : undefined,
    }

    dispatch(saveCityToMap(fullCityData))
    message.success(`Город ${selectedCity.name} сохранен на карту`)
    void dispatch(
      fetchWeatherForCity({
        coordinates: fullCityData.coordinates,
        cityName: fullCityData.name,
      }),
    )
    onClose()
  }, [dispatch, form, selectedCity, tripType, onClose])

  const renderSuggestion = useCallback((s: YandexSuggestion) => {
    const text = s.value
    return (
      <div className={styles.suggestionItem}>
        <div className={styles.suggestionMain}>
          <EnvironmentOutlined className={styles.suggestionIcon} />
          <Text strong>{text}</Text>
          {s.distance?.text && (
            <Tag color="processing" className={styles.distanceTag}>
              {s.distance.text}
            </Tag>
          )}
        </div>
        {s.subtitle && (
          <Text type="secondary" className={styles.suggestionAddress}>
            {s.subtitle.text}
          </Text>
        )}
        {s.type && (
          <div className={styles.suggestionType}>
            <Tag color="default">
              {s.type === "locality"
                ? "🏙️ Город"
                : s.type === "province"
                  ? "🏛️ Область"
                  : s.type === "street"
                    ? "🛣️ Улица"
                    : "📍 Место"}
            </Tag>
          </div>
        )}
      </div>
    )
  }, [])

  return (
    <Drawer
      title="Добавить путешествие"
      closable={{ "aria-label": "Close Button" }}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 24 } }}
    >
      <Radio.Group
        value={tripType}
        onChange={handleTypeChange}
        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
      >
        <Radio value={1}>Запланированное</Radio>
        <Radio value={2}>Прошедшее</Radio>
      </Radio.Group>

      <Form form={form} layout="vertical" autoComplete="off">
        <Title level={4} style={{ marginTop: 0 }}>
          Город
        </Title>
        <Form.Item
          name="city"
          rules={[{ required: true, message: "Введите город!" }]}
        >
          <AutoComplete
            open={autoCompleteOpen && hasQuery}
            value={searchValue}
            showSearch={{ onSearch: handleSearchInternal }}
            onSelect={value => {
              setAutoCompleteOpen(false)
              void handleSelect(value)
            }}
            onFocus={() => {
              if (hasQuery) setAutoCompleteOpen(true)
            }}
            onBlur={() => {
              setAutoCompleteOpen(false)
            }}
            placeholder="Введите название города"
            notFoundContent={
              isSuggestLoading ? "Поиск..." : "Ничего не найдено"
            }
            style={{ width: "100%" }}
            getPopupContainer={() => document.body}
          >
            {suggestResults.map((s, i) => (
              <Option key={`suggest-${String(i)}-${s.value}`} value={s.value}>
                {renderSuggestion(s)}
              </Option>
            ))}
          </AutoComplete>
        </Form.Item>

        {isSuggestLoading && (
          <div className={styles.suggestIndicator}>
            <LoadingOutlined spin /> Поиск
          </div>
        )}

        <Title level={4}>Дата поездки</Title>
        <Form.Item
          name="date"
          rules={[{ required: true, message: "Введите дату поездки!" }]}
        >
          <RangePicker style={{ width: "100%" }} />
        </Form.Item>

        <Title level={4}>Интересные места</Title>
        <Form.Item
          name="showplace"
          rules={[{ required: true, message: "Введите название места!" }]}
        >
          <Mentions
            autoSize
            style={{ width: "100%" }}
            placeholder="Введите название места"
            options={[]}
          />
        </Form.Item>

        {tripType === 2 && (
          <>
            <Title level={4}>Оценка</Title>
            <Form.Item name="rating">
              <Rate />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button
            type="primary"
            onClick={() => {
              handleSave()
            }}
            disabled={!selectedCity}
            loading={isLoading}
            block
          >
            Сохранить
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
