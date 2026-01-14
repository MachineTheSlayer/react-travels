import { NavLink } from "react-router"
import { Button, Form, Input } from "antd"
import { LeftCircleOutlined, MailOutlined } from "@ant-design/icons"

import styles from "./ForgotPasswordPage.module.css"

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TRAVELS🌎</h1>
      <div className={styles.column}>
        <h2 className={styles.subtitle}>Reset Password</h2>
        <Form
          name="email"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
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
