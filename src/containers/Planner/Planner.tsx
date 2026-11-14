import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import {
  removeCityFromMap,
  updateCity,
} from "../../components/Traveling/store/slices/citySlice"
import type { CityData } from "../../components/Traveling/store/types"
import {
  Button,
  Card,
  List,
  Space,
  Typography,
  Tooltip,
  Modal,
  Form,
  DatePicker,
  Input,
  Rate,
  Select,
  message,
  Empty,
} from "antd"
import { DeleteOutlined, EditOutlined, HomeOutlined } from "@ant-design/icons"
import type { Dayjs } from "dayjs";
import dayjs from "dayjs"
import styles from "./Planner.module.css"

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const TRIP_COLORS = {
  planned: "#52c41a",
  past: "#ff4d4f",
} as const

type FilterType = "all" | "planned" | "past"

type EditFormValues = {
  name: string
  dateRange?: [Dayjs, Dayjs]
  places?: string[]
  rating?: number
}

const Planner: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const savedCities = useAppSelector(state => state.city.savedCities)

  const [filterType, setFilterType] = useState<FilterType>("all")
  const [editingCity, setEditingCity] = useState<CityData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm<EditFormValues>()

  const filteredCities = useMemo(
    () =>
      savedCities.filter(city => {
        if (filterType === "planned") return city.tripType === "planned"
        if (filterType === "past") return city.tripType === "past"
        return true
      }),
    [savedCities, filterType],
  )

  useEffect(() => {
    if (!isModalOpen || !editingCity) return
    form.setFieldsValue({
      name: editingCity.name,
      dateRange: editingCity.dateRange
        ? [dayjs(editingCity.dateRange[0]), dayjs(editingCity.dateRange[1])]
        : undefined,
      places: editingCity.places,
      rating: editingCity.rating,
    })
  }, [isModalOpen, editingCity, form])

  const handleDelete = useCallback(
    (city: CityData) => {
      Modal.confirm({
        title: "Удалить поездку",
        content: `Вы уверены, что хотите удалить поездку в город "${city.name}"?`,
        okText: "Удалить",
        okButtonProps: { danger: true },
        cancelText: "Отмена",
        onOk: () => {
          dispatch(removeCityFromMap(city.name))
          message.success("Поездка удалена")
        },
      })
    },
    [dispatch],
  )

  const handleEdit = useCallback((city: CityData) => {
    setEditingCity(city)
    setIsModalOpen(true)
  }, [])

  const handleModalOk = useCallback(async () => {
    if (!editingCity) return
    try {
      const values = await form.validateFields()

      // Копируем исходный город, затем точечно обновляем/удаляем поля
      const updatedCity: CityData = { ...editingCity }

      if (values.dateRange) {
        updatedCity.dateRange = [
          values.dateRange[0].format("YYYY-MM-DD"),
          values.dateRange[1].format("YYYY-MM-DD"),
        ]
      } else {
        delete updatedCity.dateRange
      }

      if (values.places?.length) updatedCity.places = values.places
      else delete updatedCity.places

      if (values.rating !== undefined) updatedCity.rating = values.rating
      else delete updatedCity.rating

      dispatch(updateCity(updatedCity))
      setIsModalOpen(false)
      message.success("Поездка обновлена")
    } catch (err) {
      console.warn(err)
    }
  }, [editingCity, form, dispatch])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingCity(null)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button icon={<HomeOutlined />} onClick={() => void navigate("/")}>
          На главную
        </Button>
        <Title level={2} className={styles.title}>
          Планировщик поездок
        </Title>
      </div>

      <div className={styles.filters}>
        <Button
          type={filterType === "all" ? "primary" : "default"}
          onClick={() => { setFilterType("all"); }}
        >
          Все
        </Button>
        <Button
          type={filterType === "planned" ? "primary" : "default"}
          onClick={() => { setFilterType("planned"); }}
          className={filterType === "planned" ? styles.btnPlanned : ""}
        >
          Запланированные
        </Button>
        <Button
          type={filterType === "past" ? "primary" : "default"}
          onClick={() => { setFilterType("past"); }}
          className={filterType === "past" ? styles.btnPast : ""}
        >
          Прошедшие
        </Button>
      </div>

      {/* Список карточек */}
      {filteredCities.length === 0 ? (
        <Empty
          description={
            savedCities.length === 0
              ? "Пока нет ни одной поездки"
              : "По выбранному фильтру поездок нет"
          }
        >
          <Button type="primary" onClick={() => void navigate("/")}>
            Добавить поездку
          </Button>
        </Empty>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={filteredCities}
          renderItem={city => (
            <List.Item className={styles.listItem}>
              <Card
                className={styles.card}
                title={
                  <Tooltip title={city.name}>
                    <span
                      className={styles.cardTitle}
                      style={{
                        color:
                          city.tripType === "planned"
                            ? TRIP_COLORS.planned
                            : TRIP_COLORS.past,
                      }}
                    >
                      {city.name}
                    </span>
                  </Tooltip>
                }
                extra={
                  <Space size={0}>
                    <Tooltip title="Редактировать">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        aria-label={`Редактировать поездку в ${city.name}`}
                        onClick={() => { handleEdit(city); }}
                      />
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Удалить поездку в ${city.name}`}
                        onClick={() => { handleDelete(city); }}
                      />
                    </Tooltip>
                  </Space>
                }
              >
                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <Text type="secondary">Даты:</Text>
                    <span className={styles.ellipsis}>
                      {city.dateRange
                        ? `${city.dateRange[0]} — ${city.dateRange[1]}`
                        : "Не указаны"}
                    </span>
                  </div>

                  <div className={styles.row}>
                    <Text type="secondary">Места:</Text>
                    <span className={styles.ellipsis}>
                      {city.places?.length
                        ? city.places.join(", ")
                        : "Не указаны"}
                    </span>
                  </div>

                  {city.rating !== undefined && (
                    <div className={styles.row}>
                      <Text type="secondary">Оценка:</Text>
                      <Rate
                        disabled
                        value={city.rating}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                  )}

                  <div className={styles.row}>
                    <Text type="secondary">Адрес:</Text>
                    <Tooltip title={city.fullAddress}>
                      <span className={styles.ellipsis}>
                        {city.fullAddress}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Модалка редактирования */}
      <Modal
        title="Редактировать поездку"
        open={isModalOpen}
        onOk={() => void handleModalOk()}
        onCancel={handleCloseModal}
        width={600}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Город" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="dateRange" label="Даты поездки">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="places" label="Интересные места">
            <Select mode="tags" placeholder="Введите места" />
          </Form.Item>
          <Form.Item name="rating" label="Оценка">
            <Rate />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Planner
