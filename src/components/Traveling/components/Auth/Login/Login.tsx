import { useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { Button, Checkbox, Flex, Form, Input, Alert } from "antd"
import { LockOutlined, MailOutlined } from "@ant-design/icons"
import { useAppDispatch } from "../../../../../app/hooks"
import { login } from "../../../store/slices"
import styles from "./Login.module.css"

const Login: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setError(null)
      await dispatch(login(values)).unwrap()
      void navigate("/")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Ошибка входа")
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
        <h2 className={styles.subtitle}>Login</h2>
        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={(values: { email: string; password: string }) => {
            onFinish(values).catch(console.error)
          }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your Username!" }]}
            style={{ maxWidth: 226 }}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              style={{ width: 226 }}
            />
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
          <Form.Item>
            <Flex justify="space-between" align="center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <NavLink to="/forgot-password">Forgot password</NavLink>
            </Flex>
          </Form.Item>
          <Form.Item>
            <Button
              color="default"
              variant="solid"
              block
              type="primary"
              htmlType="submit"
            >
              Log in
            </Button>
            <p>
              or <NavLink to="/register">Register now!</NavLink>
            </p>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
