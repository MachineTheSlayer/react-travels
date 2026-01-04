import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Checkbox, Flex, Form, Input } from "antd"

import styles from "./Login.module.css"

/* export interface ILoginProps {
    setIsShowModal: React.Dispatch<React.SetStateAction<boolean>>
} */

const Login: React.FC = () => {
  /* const { setIsShowModal } = props */

  /* const handleClose = () => {
        setIsShowModal(false)
    } */

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your Username!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
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
              <a href="">Forgot password</a>
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
            or <a href="">Register now!</a>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
