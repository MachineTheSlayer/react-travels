import { NavLink } from "react-router"
import { Button, Checkbox, Flex, Form, Input } from "antd"
import { LockOutlined, UserOutlined } from "@ant-design/icons"

import styles from "./LoginPage.module.css"

/* export interface ILoginProps {
    setIsShowModal: React.Dispatch<React.SetStateAction<boolean>>
} */

const LoginPage: React.FC = () => {
  /* const { setIsShowModal } = props */

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TRAVELS🌎</h1>
      <div className={styles.column}>
        <h2 className={styles.subtitle}>Login</h2>
        <Form
          name="login"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your Username!" }]}
            style={{ maxWidth: 226 }}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              style={{ width: 226 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your Password!" }]}
          >
            <Input
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
              <NavLink to="/forgotpassword">Forgot password</NavLink>
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

export default LoginPage
