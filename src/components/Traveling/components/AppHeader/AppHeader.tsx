/* eslint-disable */
import { useCallback, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector, useTheme } from "../../../../app/hooks"
import { Link, useNavigate } from "react-router"
import { useSelector } from "react-redux"
import { logout, setUser } from "../../store/slices"
import { RootState } from "../../../../app/store"
import {
  AutoComplete,
  Avatar,
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Mentions,
  Menu,
  message,
  Modal,
  Radio,
  Rate,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd"
import { Header } from "antd/es/layout/layout"
import type {
  CardMetaProps,
  CardProps,
  GetProp,
  GetProps,
  MenuProps,
  RadioChangeEvent,
  UploadFile,
  UploadProps,
} from "antd"
import { createStyles } from "antd-style"
import {
  UserOutlined,
  LogoutOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EditOutlined,
  AudioOutlined,
  EnvironmentOutlined,
  PushpinOutlined,
  DeleteOutlined,
  SaveOutlined,
  LoadingOutlined,
  SunOutlined,
  MoonOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import {
  setSearchValue,
  selectCity,
  saveCityToMap,
  clearSelectedCity,
  removeFromHistory,
  clearHistory,
  getSuggestions,
  getCoordinatesForSuggestion,
  clearSuggestions,
  loadHistoryFromStorage,
  fetchWeatherForCity,
} from "../../store/slices/citySlice"
// import  { getApiHotels, getApiResource } from "../../../../utils/network"
import styles from "./AppHeader.module.css"
import {
  SearchHistoryItem,
  YandexSuggestion,
  CityData,
  User,
} from "../../store/types"
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher"
import { cacheUser } from "../../../../utils/cacheStorage"

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0]

export interface IHeaderProps {
  // key: string; // Note: key is usually a special prop in React lists, consider renaming to id or similar if it's a regular prop
  // value: string;
  children?: React.ReactNode
  collapsed?: boolean
  onToggleSidebar?: () => void
}

/* interface CityData {
  name: string;
  coordinates: [number, number];
  fullAddress: string;
  description?: string;
} */

interface SuggestionItem {
  value: string
  text: string
  coordinates: [number, number]
  fullAddress: string
}

type MenuItem = Required<MenuProps>["items"][number]

type SearchProps = GetProps<typeof Input.Search>

const { RangePicker } = DatePicker

const { Title, Text } = Typography

const { Option } = AutoComplete

const useStyles = createStyles(({ token }) => ({
  root: {
    width: 300,
    backgroundColor: token.colorBgContainer,
    borderRadius: token.borderRadius,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: `1px solid ${token.colorBorderSecondary}`,
  },
  header: {
    borderBottom: "none",
    paddingBottom: 8,
  },
  body: {
    paddingTop: 0,
  },
}))

const stylesCard: CardProps["styles"] = {
  root: {
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
  },
}

const { Search } = Input

const AppHeader: React.FC<IHeaderProps> = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<YandexSuggestion | null>(null)
  const { user } = useSelector((state: RootState) => state.auth)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(null)
  const [showModalProfile, setShowModalProfile] = useState<boolean>(false)
  const { styles: classNames } = useStyles()
  const [form] = Form.useForm()
  // const [suggestions, setSuggestions] = useState<YandexSuggestion[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.photoURL || null,
  )
  const [isHovered, setIsHovered] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const selectedFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [isDark])

  const handleCancel = () => {
    setPreviewUrl(user?.photoURL || null) // возвращаем исходное
    setIsHovered(false)
    setShowModalProfile(false)
  }

  const beforeUpload = (file: File) => {
    selectedFileRef.current = file
    // Читаем файл и ставим превью
    const reader = new FileReader()
    reader.onload = e => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Отменяем автоматическую загрузку на сервер
    return false
  }

  const handleRemovePhoto = async () => {
    if (!user) return
    try {
      const updatedUser: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: null,
      }
      dispatch(setUser(updatedUser))
      cacheUser(updatedUser)
      setPreviewUrl(null)
      setIsHovered(false)
      messageApi.success("Фото удалено")
    } catch (error) {
      messageApi.error("Ошибка при удалении фото")
    }
  }

  const handleCloseModal = () => {
    setPreviewUrl(user?.photoURL || null)
    setIsHovered(false)
    setShowModalProfile(false)
  }

  // Сохранение изменений
  const handleSave = async () => {
    // Проверка, что пользователь существует
    if (!user || !user.uid) {
      messageApi.error("Пользователь не найден")
      return
    }

    // Если новое фото не выбрано, но, возможно, хотели удалить – тоже обработаем
    if (previewUrl === user?.photoURL) {
      messageApi.info("Нет изменений")
      return
    }
    setLoading(true)
    try {
      // Создаём обновлённого пользователя
      const updatedUser: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        // Если previewUrl === null → фото удалено
        photoURL: previewUrl,
      }

      // 3. Обновление Redux store
      dispatch(setUser(updatedUser))
      // Сохраняем в localStorage (синхронизация)
      cacheUser(updatedUser)
      messageApi.success(previewUrl ? "Фото обновлено" : "Фото удалено")
      setShowModalProfile(false)
    } catch (error) {
      messageApi.error("Ошибка сохранения фото")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  const isNewPhoto = previewUrl !== (user?.photoURL || null)

  const footerButtons = []
  if (isNewPhoto) {
    footerButtons.push(
      <Button
        key="save"
        type="primary"
        loading={loading}
        onClick={handleSave}
        color="default"
        variant="solid"
        htmlType="submit"
      >
        Сохранить
      </Button>,
    )
  }

  const {
    searchValue,
    // suggestions,
    suggestResults,
    isLoading,
    isSuggestLoading,
    selectedCity,
    searchHistory,
    savedCities,
  } = useAppSelector(state => state.city)

  const { isApiLoaded } = useAppSelector(state => state.map)
  const ymapsInstance = window.ymaps

  // Загрузка истории при монтировании
  useEffect(() => {
    dispatch(loadHistoryFromStorage())
  }, [dispatch])

  // Логируем состояние при монтировании и обновлении
  useEffect(() => {
    console.log("🏪 CityDrawer: Состояние Redux")
    console.log("  - ymapsInstance:", !!ymapsInstance)
    console.log("  - isApiLoaded:", isApiLoaded)
    console.log("  - ymapsInstance.suggest:", !!ymapsInstance?.suggest)

    if (ymapsInstance) {
      console.log(
        "  - Доступные методы ymapsInstance:",
        Object.keys(ymapsInstance),
      )
    }
  }, [ymapsInstance, isApiLoaded])

  // Обработчик поиска с Яндекс Suggest
  const handleSearch = useCallback(
    (value: string) => {
      console.log("🔍 handleSearch вызван с value:", value)
      dispatch(setSearchValue(value))
      // Проверяем наличие ymapsInstance
      if (!ymapsInstance) {
        console.warn("⚠️ ymapsInstance отсутствует")
        return
      }

      if (!ymapsInstance.suggest) {
        console.warn(
          "⚠️ ymapsInstance.suggest отсутствует. Доступные методы:",
          Object.keys(ymapsInstance),
        )
        return
      }

      if (!value.trim()) {
        console.log("🔍 Пустой запрос, очищаем подсказки")
        return
      }

      if (!isApiLoaded) {
        console.warn("⚠️ API еще не загружен (isApiLoaded = false)")
        // setSuggestions([]);
        return
      }

      dispatch(getSuggestions({ query: value, ymaps: ymapsInstance }))
    },
    [dispatch, ymapsInstance, isApiLoaded],
  )

  // Обработчик выбора подсказки
  const handleSelect = useCallback(
    async (value: string) => {
      console.log("🔍 handleSelect вызван, value:", value)
      console.log("🔍 suggestResults:", suggestResults)
      const suggestion = suggestResults.find(s => s.value === value)
      console.log("🔍 найденная подсказка:", suggestion)
      console.log("render suggestResults length:", suggestResults?.length)

      if (suggestion && ymapsInstance) {
        const result = await dispatch(
          getCoordinatesForSuggestion({
            suggestion,
            ymaps: ymapsInstance,
          }),
        ).unwrap()
        console.log("🔍 Координаты от геокодера:", result?.coordinates)

        if (result) {
          dispatch(
            selectCity({
              name: result.value,
              coordinates: result.coordinates,
              fullAddress: result.fullAddress,
            }),
          )
          message.success(`Выбран город: ${result.value}`)
        }
      }
    },
    [dispatch, ymapsInstance, suggestResults],
  )

  // Обработчик выбора из геокодера (на случай, если suggest не сработает)
  /* const handleGeocodeSelect = useCallback((value: string) => {
    const selected = suggestions.find(s => s.value === value);
    if (selected) {
      dispatch(selectCity({
        name: selected.value,
        coordinates: selected.coordinates,
        fullAddress: selected.fullAddress
      }));
      message.success(`Выбран город: ${selected.value}`);
    }
  }, [dispatch, suggestions]); */

  // Обработчик сохранения на карту
  const handleSaveToMap = () => {
    if (!selectedCity) {
      message.warning("Сначала выберите город")
      return
    }

    // Получаем данные из формы
    const dateRange = form.getFieldValue("date") // [dayjs, dayjs] или null
    let places = form.getFieldValue("showplace")
    // Если places не массив (например, строка от Mentions), преобразуем
    if (places && !Array.isArray(places)) {
      places = places.split(/[\n,]+/).filter((s: string) => s.trim().length > 0)
    }
    const rating = form.getFieldValue("rating") // число (для прошедших)

    const fullCityData: CityData = {
      ...selectedCity,
      tripType: value === 1 ? "planned" : "past",
      dateRange: dateRange
        ? [dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD")]
        : undefined,
      places: places?.length ? places : undefined,
      rating: value === 2 ? rating : undefined,
    }

    dispatch(saveCityToMap(fullCityData))
    message.success(`Город ${selectedCity.name} сохранен на карту`)
    onClose()

    dispatch(
      fetchWeatherForCity({
        coordinates: fullCityData.coordinates,
        cityName: fullCityData.name,
      }),
    )
  }

  // Выбор города из истории
  const handleHistorySelect = (city: SearchHistoryItem) => {
    dispatch(selectCity(city))
    message.success(`Загружен из истории: ${city.name}`)
  }

  // Выбор города из сохраненных
  const handleSavedCitySelect = (city: SearchHistoryItem) => {
    dispatch(selectCity(city))
    message.success(`Выбран город: ${city.name}`)
  }

  // Очистка выбора
  const handleClearSelection = () => {
    dispatch(clearSelectedCity())
    dispatch(clearSuggestions())
  }

  // Форматирование подсказки для отображения
  const renderSuggestionItem = (suggestion: YandexSuggestion) => {
    const text = suggestion.value || suggestion.displayName || ""
    const hasDistance = suggestion.distance?.text
    const hasType = suggestion.type

    return (
      <div className={styles.suggestionItem}>
        <div className={styles.suggestionMain}>
          <EnvironmentOutlined className={styles.suggestionIcon} />
          <Text strong>{text}</Text>
          {hasDistance && (
            <Tag color="processing" className={styles.distanceTag}>
              {suggestion.distance?.text}
            </Tag>
          )}
        </div>
        {suggestion.subtitle && (
          <Text type="secondary" className={styles.suggestionAddress}>
            {suggestion.subtitle.text}
          </Text>
        )}
        {hasType && (
          <div className={styles.suggestionType}>
            <Tag color="default">
              {suggestion.type === "locality"
                ? "🏙️ Город"
                : suggestion.type === "province"
                  ? "🏛️ Область"
                  : suggestion.type === "street"
                    ? "🛣️ Улица"
                    : "📍 Место"}
            </Tag>
          </div>
        )}
      </div>
    )
  }

  /* const url = "https://whitelabel.travel.yandex-net.ru/hotels/suggest/?query=екатерин&region_limit=5&hotel_limit=10&affiliate_clid=y0__xDtwaOlAhiL0iEg9rj5yRbpaCnNTGS51On11zcVWtXqg9yzuA"

    useEffect(() => {
        (async() => {
            const response = await getApiHotels(url)
            console.log(response)
            setSearchHotels(response)
        })()
    },[]) */

  /* useEffect(() => {
        (async() => {
            const response = await getApiResource()
            console.log(response)
            setSearchId(response)
        })()
    },[]) */

  /* useEffect(() => {
        fetch("https://cors-anywhere.herokuapp.com/https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=KUF&destination=MOW&departure_at=2026-06&return_at=2026-06&unique=false&sorting=price&direct=false&currency=rub&limit=30&page=1&one_way=true&token=09a4123fda29bbe35c02e12c275469b6")
            .then((res)=> res.json())
            .then((res)=> {
                console.log(res)
                setSearchId(res)
            })
            .catch((e)=> console.log(e))
    },[]) */

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value)
    form.resetFields()
  }

  const sharedCardProps: CardProps = {
    classNames,
  }

  const sharedCardMetaProps: CardMetaProps = {
    avatar: <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />,
    description: "This is the description",
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const showDrawer = () => {
    setOpen(true)
  }

  const onClose = () => {
    setOpen(false)
  }

  const showModal = () => {
    setShowModalProfile(true)
    console.log(showModalProfile)
  }

  const itemsMenu: MenuItem[] = [
    {
      label: "Добавить",
      key: "add",
      onClick: showDrawer,
    },
    {
      label: <Link to="/planner">Планировщик</Link>,
      key: "planner",
    },
  ]

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <Button
          type="link"
          onClick={showModal}
          style={{ color: isDark ? "#ffffff" : "#000000" }}
        >
          Профиль
        </Button>
      ),
      icon: <UserOutlined />,
    },
    {
      key: "logout",
      label: (
        <Button
          type="link"
          onClick={handleLogout}
          style={{ color: isDark ? "#ffffff" : "#000000" }}
        >
          Выйти
        </Button>
      ),
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <Header
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        background: isDark ? "#141414" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          textShadow: isDark
            ? "0 0 2px #fff,0 0 40px #ffff00"
            : "0 0 10px rgba(0,0,0,0.5)",
        }}
      >
        TRAVELS 🌎
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: isDark ? "#141414" : "#ffffff",
                // Убрать фон (сделать прозрачным) #001529
                darkItemSelectedBg: "transparent",
                // darkItemSelectedColor: "none"
              },
            },
          }}
        >
          <Menu
            theme={isDark ? "dark" : "light"}
            mode="horizontal"
            selectable={false}
            style={{
              flex: 1,
              minWidth: 0,
              outline: "none",
              color: isDark ? "#ffffff" : "#000000",
            }}
            items={itemsMenu}
          ></Menu>
        </ConfigProvider>
        <div style={{ color: isDark ? "#ffffff" : "#000000" }}>
          <ThemeSwitcher showLabel={true} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Drawer
            title="Добавить путешествие"
            closable={{ "aria-label": "Close Button" }}
            onClose={onClose}
            open={open}
          >
            <Radio.Group
              defaultValue={null}
              onChange={onChange}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio value={1}>Запланированное </Radio>
              <Radio value={2}>Прошедшее </Radio>
            </Radio.Group>
            <div>
              {value === 1 && (
                <div className={styles.card__container}>
                  <Card
                    {...sharedCardProps}
                    styles={stylesCard}
                    variant="borderless"
                    style={{ top: 25 }}
                  >
                    <Form
                      name="basic"
                      form={form}
                      labelCol={{ span: 8 }}
                      wrapperCol={{ span: 16 }}
                      style={{ maxWidth: 600 }}
                      initialValues={{ remember: true }}
                      autoComplete="off"
                    >
                      <Title level={4} style={{ marginTop: 0 }}>
                        Город
                      </Title>
                      <Form.Item
                        name="city"
                        rules={[{ required: true, message: "Введите город!" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <div>
                          <AutoComplete
                            value={searchValue}
                            showSearch={{ onSearch: handleSearch }}
                            onSelect={handleSelect}
                            placeholder="Введите название города"
                            notFoundContent={
                              isSuggestLoading
                                ? "Поиск..."
                                : "Ничего не найдено"
                            }
                            style={{ width: 250 }}
                            getPopupContainer={triggerNode => document.body}
                          >
                            {suggestResults?.map((suggestion, index) => (
                              <Option
                                key={`suggest-${index}-${suggestion.value}`}
                                value={suggestion.value}
                              >
                                {renderSuggestionItem(suggestion)}
                              </Option>
                            ))}
                          </AutoComplete>

                          {/* Индикатор работы Suggest */}
                          {isSuggestLoading && (
                            <div className={styles.suggestIndicator}>
                              <LoadingOutlined spin /> Поиск
                            </div>
                          )}

                          {/* Информация о выбранном городе */}
                          {selectedCity && (
                            <Card
                              className={styles.selectedCityCard}
                              style={{ color: isDark ? "#000000" : "#000000" }}
                            >
                              <Space
                                orientation="vertical"
                                size="small"
                                style={{ width: "100%" }}
                              >
                                <div className={styles.selectedCityHeader}>
                                  <Space>
                                    <PushpinOutlined
                                      className={styles.selectedIcon}
                                    />
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      strong
                                    >
                                      Выбранный город:
                                    </Text>
                                  </Space>
                                </div>
                                <div
                                  className={styles.cityInfo}
                                  style={{
                                    color: isDark ? "#000000" : "#000000",
                                  }}
                                >
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      🏙️ Название:
                                    </Text>
                                    {selectedCity.name}
                                  </div>
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      📍 Координаты:
                                    </Text>
                                    <Tooltip title="Широта, Долгота">
                                      <Tag
                                        color="processing"
                                        className={styles.coordinatesTag}
                                      >
                                        {selectedCity.coordinates[0].toFixed(4)}
                                        °,{" "}
                                        {selectedCity.coordinates[1].toFixed(4)}
                                        °
                                      </Tag>
                                    </Tooltip>
                                  </div>
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      🏢 Адрес:
                                    </Text>
                                    <Text className={styles.address}>
                                      {selectedCity.fullAddress}
                                    </Text>
                                  </div>
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    onClick={handleClearSelection}
                                  >
                                    Очистить
                                  </Button>
                                </div>
                              </Space>
                            </Card>
                          )}
                        </div>
                      </Form.Item>
                      <Title level={4} style={{ marginTop: 15 }}>
                        Дата поездки
                      </Title>
                      <Form.Item
                        name="date"
                        rules={[
                          { required: true, message: "Введите дату поездки!" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <RangePicker style={{ width: 250 }} />
                      </Form.Item>
                      <Title style={{ width: 250, marginTop: 15 }} level={4}>
                        Интересные места
                      </Title>
                      <Form.Item
                        name="showplace"
                        rules={[
                          {
                            required: true,
                            message: "Введите название места!",
                          },
                        ]}
                        style={{ marginBottom: 20 }}
                      >
                        <Mentions
                          autoSize
                          style={{ width: 250 }}
                          placeholder="Введите название места"
                          options={[]}
                        />
                      </Form.Item>
                      <Form.Item label={null} style={{ marginBottom: 0 }}>
                        <Button
                          color="default"
                          variant="solid"
                          type="primary"
                          htmlType="submit"
                          onClick={handleSaveToMap}
                          disabled={!selectedCity}
                          loading={isLoading}
                        >
                          Сохранить
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )}
              {value === 2 && (
                <div className={styles.card__container}>
                  <Card
                    {...sharedCardProps}
                    styles={stylesCard}
                    variant="borderless"
                    style={{ top: 25 }}
                  >
                    <Form
                      name="basic"
                      form={form}
                      labelCol={{ span: 8 }}
                      wrapperCol={{ span: 16 }}
                      style={{ maxWidth: 600 }}
                      initialValues={{ remember: true }}
                      autoComplete="off"
                    >
                      <Title level={4} style={{ marginTop: 0 }}>
                        Город
                      </Title>
                      <Form.Item
                        name="city"
                        rules={[{ required: true, message: "Введите город!" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <div>
                          <AutoComplete
                            value={searchValue}
                            showSearch={{ onSearch: handleSearch }}
                            onSelect={handleSelect}
                            placeholder="Введите название города"
                            notFoundContent={
                              isSuggestLoading
                                ? "Поиск..."
                                : "Ничего не найдено"
                            }
                            style={{ width: 250 }}
                            getPopupContainer={triggerNode => document.body}
                          >
                            {suggestResults?.map((suggestion, index) => (
                              <Option
                                key={`suggest-${index}-${suggestion.value}`}
                                value={suggestion.value}
                              >
                                {renderSuggestionItem(suggestion)}
                              </Option>
                            ))}
                          </AutoComplete>

                          {/* Индикатор работы Suggest */}
                          {isSuggestLoading && (
                            <div className={styles.suggestIndicator}>
                              <LoadingOutlined spin /> Поиск
                            </div>
                          )}

                          {/* Информация о выбранном городе */}
                          {selectedCity && (
                            <Card
                              className={styles.selectedCityCard}
                              style={{ color: isDark ? "#000000" : "#000000" }}
                            >
                              <Space
                                orientation="vertical"
                                size="small"
                                style={{ width: "100%" }}
                              >
                                <div className={styles.selectedCityHeader}>
                                  <Space>
                                    <PushpinOutlined
                                      className={styles.selectedIcon}
                                    />
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      strong
                                    >
                                      Выбранный город:
                                    </Text>
                                  </Space>
                                </div>
                                <div className={styles.cityInfo}>
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      🏙️ Название:
                                    </Text>
                                    {selectedCity.name}
                                  </div>
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      📍 Координаты:
                                    </Text>
                                    <Tooltip title="Широта, Долгота">
                                      <Tag
                                        color="processing"
                                        className={styles.coordinatesTag}
                                      >
                                        {selectedCity.coordinates[0].toFixed(4)}
                                        °,{" "}
                                        {selectedCity.coordinates[1].toFixed(4)}
                                        °
                                      </Tag>
                                    </Tooltip>
                                  </div>
                                  <div className={styles.infoRow}>
                                    <Text
                                      style={{
                                        color: isDark ? "#000000" : "#000000",
                                      }}
                                      type="secondary"
                                    >
                                      🏢 Адрес:
                                    </Text>
                                    <Text className={styles.address}>
                                      {selectedCity.fullAddress}
                                    </Text>
                                  </div>
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    onClick={handleClearSelection}
                                  >
                                    Очистить
                                  </Button>
                                </div>
                              </Space>
                            </Card>
                          )}
                        </div>
                      </Form.Item>
                      <Title level={4} style={{ marginTop: 15 }}>
                        Дата поездки
                      </Title>
                      <Form.Item
                        name="date"
                        rules={[
                          { required: true, message: "Введите дату поездки!" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <RangePicker style={{ width: 250 }} />
                      </Form.Item>
                      <Title style={{ width: 250, marginTop: 15 }} level={4}>
                        Интересные места
                      </Title>
                      <Form.Item
                        name="showplace"
                        rules={[
                          {
                            required: true,
                            message: "Введите название места!",
                          },
                        ]}
                        style={{ marginBottom: 20 }}
                      >
                        <Mentions
                          autoSize
                          style={{ width: 250 }}
                          placeholder="Введите название места"
                          options={[]}
                        />
                      </Form.Item>
                      <Title level={4} style={{ marginTop: 15 }}>
                        Оценка
                      </Title>
                      <Form.Item name="rating" style={{ marginBottom: 20 }}>
                        <Rate />
                      </Form.Item>
                      <Form.Item label={null} style={{ marginBottom: 0 }}>
                        <Button
                          color="default"
                          variant="solid"
                          type="primary"
                          htmlType="submit"
                          onClick={handleSaveToMap}
                          disabled={!selectedCity}
                          loading={isLoading}
                        >
                          Сохранить
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )}
            </div>
          </Drawer>
        </div>
        {user && (
          <Dropdown menu={{ items }} trigger={["hover"]}>
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: isDark ? "#ffffff" : "#000000",
              }}
            >
              <Avatar
                src={user.photoURL}
                icon={!user.photoURL && <UserOutlined />}
              />
              <span style={{ color: isDark ? "#ffffff" : "#000000" }}>
                {user.displayName || user.email?.split("@")[0]}
              </span>
            </div>
          </Dropdown>
        )}
        <Modal
          title="Профиль"
          open={showModalProfile}
          onCancel={handleCloseModal}
          footer={footerButtons.length > 0 ? footerButtons : null}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ marginTop: 20 }}>
              {user && (
                <span
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    fontWeight: "bold",
                  }}
                >
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              )}
            </div>
            {/* Блок с аватаром и кнопкой удаления */}
            <div
              style={{ position: "relative", display: "inline-block" }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Avatar
                size={128}
                src={previewUrl}
                icon={!previewUrl && <UserOutlined />}
              />
              {isHovered && !isNewPhoto && previewUrl && (
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  size="middle"
                  icon={<DeleteOutlined />}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    zIndex: 2,
                    opacity: 0.9,
                    transition: "opacity 0.2s",
                  }}
                  onClick={handleRemovePhoto}
                />
              )}
            </div>
            <div style={{ marginBottom: 10, marginTop: 10 }}>
              {contextHolder}
              <Upload beforeUpload={beforeUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Выбрать фото</Button>
              </Upload>
            </div>
          </div>
        </Modal>
      </div>
    </Header>
  )
}

export default AppHeader
