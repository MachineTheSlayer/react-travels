import { useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { Button, Form, Input, Alert } from "antd"
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons"
import { useAppDispatch } from "../../../../../app/hooks"
import { register } from "../../../store/slices"
import styles from "./Register.module.css"

const Register: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const onFinish = async (values: {
    email: string
    password: string
    passwordConfirm: string
    displayName: string
  }) => {
    if (values.password !== values.passwordConfirm) {
      setError("Пароли не совпадают")
      return
    }

    try {
      setError(null)
      console.log(values)
      await dispatch(
        register({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
        }),
      ).unwrap()
      void navigate("/")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Ошибка регистрации")
        return
      } else {
        console.log("Произошла неизвестная ошибка", error)
      }
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TRAVELS🌎</h1>
      <div className={styles.column}>
        <h2 className={styles.subtitle}>Register</h2>
        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: 8 }}
          />
        )}
        <Form
          name="register"
          initialValues={{ remember: true }}
          onFinish={(values: {
            email: string
            password: string
            passwordConfirm: string
            displayName: string
          }) => {
            onFinish(values).catch(console.error)
          }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your Username!" }]}
            style={{ width: 226 }}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your Password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>
          <Form.Item
            name="passwordConfirm"
            rules={[{ required: true, message: "Please input your Password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              type="password"
              placeholder="Confirm Password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              color="default"
              variant="solid"
              block
              type="primary"
              htmlType="submit"
            >
              Sign Up
            </Button>
            <p>
              Already have an account? <NavLink to="/login">Sign in</NavLink>
            </p>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Register
