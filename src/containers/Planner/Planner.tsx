/* eslint-disable */
import React, { useState } from "react"
import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import {
  removeCityFromMap,
  updateCity,
} from "../../components/Traveling/store/slices/citySlice"
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
} from "antd"
import { DeleteOutlined, EditOutlined, HomeOutlined } from "@ant-design/icons"
import dayjs from "dayjs"

const { Title } = Typography
const { RangePicker } = DatePicker

const Planner: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const savedCities = useAppSelector(state => state.city.savedCities)
  const [filterType, setFilterType] = useState<"all" | "planned" | "past">(
    "all",
  )
  const [editingCity, setEditingCity] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const filteredCities = savedCities.filter(city => {
    if (filterType === "planned") return city.tripType === "planned"
    if (filterType === "past") return city.tripType === "past"
    return true
  })

  const handleDelete = (city: any) => {
    Modal.confirm({
      title: "Удалить поездку",
      content: `Вы уверены, что хотите удалить поездку в город "${city.name}"?`,
      onOk: () => {
        dispatch(removeCityFromMap(city.name))
        message.success("Поездка удалена")
      },
    })
  }

  const handleEdit = (city: any) => {
    setEditingCity(city)
    form.setFieldsValue({
      name: city.name,
      dateRange: city.dateRange
        ? [dayjs(city.dateRange[0]), dayjs(city.dateRange[1])]
        : null,
      places: city.places || [],
      rating: city.rating,
    })
    setIsModalOpen(true)
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const updatedCity = {
        ...editingCity,
        dateRange: values.dateRange
          ? [
              values.dateRange[0].format("YYYY-MM-DD"),
              values.dateRange[1].format("YYYY-MM-DD"),
            ]
          : undefined,
        places: values.places,
        rating: values.rating,
      }
      dispatch(updateCity(updatedCity))
      setIsModalOpen(false)
      message.success("Поездка обновлена")
    })
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <Button icon={<HomeOutlined />} onClick={() => navigate("/")}>
          На главную
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          Планировщик поездок
        </Title>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type={filterType === "all" ? "primary" : "default"}
            onClick={() => setFilterType("all")}
          >
            Все
          </Button>
          <Button
            type={filterType === "planned" ? "primary" : "default"}
            onClick={() => setFilterType("planned")}
            style={{
              background: filterType === "planned" ? "#52c41a" : undefined,
            }}
          >
            Запланированные
          </Button>
          <Button
            type={filterType === "past" ? "primary" : "default"}
            onClick={() => setFilterType("past")}
            style={{
              background: filterType === "past" ? "#ff4d4f" : undefined,
            }}
          >
            Прошедшие
          </Button>
        </Space>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={filteredCities}
        renderItem={city => (
          <List.Item>
            <Card
              title={
                <span
                  style={{
                    color: city.tripType === "planned" ? "#52c41a" : "#ff4d4f",
                    fontWeight: "bold",
                  }}
                >
                  {city.name}
                </span>
              }
              extra={
                <Space>
                  <Tooltip title="Редактировать">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(city)}
                    />
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(city)}
                    />
                  </Tooltip>
                </Space>
              }
            >
              <p>
                <strong>Даты:</strong>{" "}
                {city.dateRange
                  ? `${city.dateRange[0]} — ${city.dateRange[1]}`
                  : "Не указаны"}
              </p>
              <p>
                <strong>Интересные места:</strong>{" "}
                {city.places?.join(", ") || "Не указаны"}
              </p>
              {city.rating && (
                <div>
                  <strong>Оценка:</strong>{" "}
                  <Rate
                    disabled
                    defaultValue={city.rating}
                    style={{ fontSize: 14 }}
                  />
                </div>
              )}
              <p>
                <strong>Адрес:</strong> {city.fullAddress}
              </p>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Редактировать поездку"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
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
