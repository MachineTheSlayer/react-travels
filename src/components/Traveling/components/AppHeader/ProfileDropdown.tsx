import { useCallback, useRef, useState } from "react"
import { Avatar, Button, Dropdown, Modal, Upload, message } from "antd"
import type { MenuProps } from "antd"
import {
  DeleteOutlined,
  LogoutOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector, useTheme } from "../../../../app/hooks"
import { logout, setUser } from "../../store/slices"
import { cacheUser } from "../../../../utils/cacheStorage"
import type { User } from "../../store/types"
import styles from "./AppHeader.module.css"

type ProfileDropdownProps = {
  isMobile: boolean
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isMobile,
}) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const user = useAppSelector(state => state.auth.user)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user ? user.photoURL : null,
  )
  const [isHovered, setIsHovered] = useState(false)
  const [loading, setLoading] = useState(false)
  const selectedFileRef = useRef<File | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false)
    try {
      await dispatch(logout()).unwrap()
      void navigate("/login")
    } catch (e) {
      console.error("Logout error:", e)
    }
  }, [dispatch, navigate])

  const openProfileModal = useCallback(() => {
    setDropdownOpen(false)
    setPreviewUrl(user ? user.photoURL : null)
    setModalOpen(true)
  }, [user])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setPreviewUrl(user ? user.photoURL : null)
    setIsHovered(false)
  }, [user])

  const beforeUpload = useCallback((file: File) => {
    selectedFileRef.current = file
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result
      setPreviewUrl(typeof result === "string" ? result : null)
    }
    reader.readAsDataURL(file)
    return false
  }, [])

  const handleRemovePhoto = useCallback(() => {
    if (!user) return
    const updated: User = { ...user, photoURL: null }
    dispatch(setUser(updated))
    cacheUser(updated)
    setPreviewUrl(null)
    setIsHovered(false)
    messageApi.success("Фото удалено")
  }, [dispatch, user, messageApi])

  const handleSave = useCallback(() => {
    if (!user) return
    const currentPhoto = user.photoURL
    if (previewUrl === currentPhoto) return
    setLoading(true)
    try {
      const updated: User = { ...user, photoURL: previewUrl }
      dispatch(setUser(updated))
      cacheUser(updated)
      messageApi.success(previewUrl ? "Фото обновлено" : "Фото удалено")
      setModalOpen(false)
    } catch {
      messageApi.error("Ошибка сохранения фото")
    } finally {
      setLoading(false)
    }
  }, [dispatch, user, previewUrl, messageApi])

  const isNewPhoto = previewUrl !== (user ? user.photoURL : null)

  const items: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Профиль",
      onClick: openProfileModal,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      onClick: () => void handleLogout(),
    },
  ]

  if (!user) return null

  const footer = isNewPhoto
    ? [
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleSave}
        >
          Сохранить
        </Button>,
      ]
    : []

  return (
    <>
      {contextHolder}
      <Dropdown
        menu={{ items }}
        trigger={isMobile ? ["click"] : ["hover"]}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <div
          className={styles.userInfo}
          style={{ color: isDark ? "#ffffff" : "#000000" }}
        >
          <Avatar
            src={user.photoURL}
            icon={!user.photoURL && <UserOutlined />}
          />
          <span className={styles.name}>
            {user.displayName ?? user.email?.split("@")[0] ?? "User"}
          </span>
        </div>
      </Dropdown>

      <Modal
        title="Профиль"
        open={modalOpen}
        onCancel={closeModal}
        footer={footer.length > 0 ? footer : null}
      >
        <div className={styles.modalContent}>
          <span
            style={{
              color: isDark ? "#ffffff" : "#000000",
              fontWeight: "bold",
            }}
          >
            {user.displayName ?? user.email?.split("@")[0] ?? "User"}
          </span>
          <div
            className={styles.avatarWrapper}
            onMouseEnter={() => { setIsHovered(true); }}
            onMouseLeave={() => { setIsHovered(false); }}
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
                className={styles.removePhotoBtn}
                onClick={handleRemovePhoto}
              />
            )}
          </div>
          <Upload beforeUpload={beforeUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Выбрать фото</Button>
          </Upload>
        </div>
      </Modal>
    </>
  )
}
