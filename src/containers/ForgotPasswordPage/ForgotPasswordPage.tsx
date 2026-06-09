/* eslint-disable */
import { NavLink, useNavigate } from "react-router"
import { Alert, Button, Form, Input, message } from "antd"
import { LeftCircleOutlined, MailOutlined } from "@ant-design/icons"

import styles from "./ForgotPasswordPage.module.css"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { resetPassword } from "../../components/Traveling/store/slices"
import { AppDispatch } from "../../app/store"

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const onFinish = async (values: { email: string }) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await dispatch(resetPassword(values.email)).unwrap()
      setSuccess(true)
      message.success("Письмо для сброса пароля отправлено на ваш email")
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err: any) {
      const errorMsg = err.message || "Ошибка при отправке письма"
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TRAVELS🌎</h1>
      <div className={styles.column}>
        <h2 className={styles.subtitle}>Reset Password</h2>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16, maxWidth: 360 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            message="Письмо отправлено!"
            description="Проверьте вашу почту и следуйте инструкциям для сброса пароля."
            type="success"
            showIcon
            style={{ marginBottom: 16, maxWidth: 360 }}
          />
        )}

        <Form
          name="email"
          onFinish={onFinish}
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
            style={{ width: 226 }}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <Button
              color="default"
              variant="solid"
              block
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={success}
            >
              Reset
            </Button>
          </Form.Item>
          <Form.Item style={{ display: "flex", justifyContent: "center" }}>
            <NavLink to="/login">
              Back <LeftCircleOutlined />
            </NavLink>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
