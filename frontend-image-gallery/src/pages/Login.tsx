import React, { useEffect, useState } from 'react'
import { Form, Input, Button, message, Spin, Typography } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'
import { getCaptchaImage, login, register } from '../services/loginApi'
import './Login.css'

const { Title } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaUuid, setCaptchaUuid] = useState('')
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [registerEnabled, setRegisterEnabled] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const fetchCaptcha = async () => {
    try {
      const res = await getCaptchaImage()
      const data = (res as any).data
      setCaptchaEnabled(data.captchaEnabled)
      setRegisterEnabled(data.registerEnabled)
      if (data.captchaEnabled) {
        setCaptchaUrl('data:image/gif;base64,' + data.img)
        setCaptchaUuid(data.uuid)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [])

  const toggleMode = () => {
    setIsRegister(!isRegister)
    form.resetFields()
    if (captchaEnabled) {
      fetchCaptcha()
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (isRegister) {
        // Register Logic
        const params = {
          username: values.username,
          password: values.password,
          confirmPassword: values.confirmPassword,
          code: values.code,
          uuid: captchaUuid
        }
        const res = await register(params)
        const data = (res as any).data
        if (data.code === 200) {
          message.success('注册成功，请登录')
          setIsRegister(false)
          form.resetFields()
          if (captchaEnabled) fetchCaptcha()
        } else {
          message.error(data.msg || '注册失败')
          if (captchaEnabled) fetchCaptcha()
        }
      } else {
        // Login Logic
        const params = {
          username: values.username,
          password: values.password,
          code: values.code,
          uuid: captchaUuid
        }
        const res = await login(params)
        const data = (res as any).data
        if (data.code === 200) {
          // Check if data.data exists before accessing token
          // The backend returns { code: 200, data: { token: '...' } } or similar structure
          // Sometimes it might be { code: 200, token: '...' } depending on response util
          const token = data.data?.token || data.token
          if (token) {
            Cookies.set('Admin-Token', token, { path: '/' })
            message.success('登录成功')
            let from = (location.state as any)?.from?.pathname || '/home'
            if (from === '/login') {
              from = '/home'
            }
            // 确保 Cookie 写入后再跳转
            setTimeout(() => {
              window.location.href = from
            }, 100)
          } else {
            console.error('Token not found in response:', data)
            message.error('登录返回数据异常')
            if (captchaEnabled) fetchCaptcha()
          }
        } else {
          message.error(data.msg || '登录失败')
          if (captchaEnabled) fetchCaptcha()
        }
      }
    } catch (error) {
      console.error(error)
      message.error(isRegister ? '注册异常' : '登录异常')
      if (captchaEnabled) fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  // Particle animation variants
  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      opacity: [0.2, 0.5, 0.2],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="login-container">
      {/* Dynamic Background Elements */}
      <div className="background-shapes">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            variants={particleVariants}
            animate="animate"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="login-card"
      >
        <div className="login-header">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="logo-circle"
          >
            <div className="logo-inner" />
          </motion.div>
          <Title level={2} className="login-title">
            IMAGE GALLERY
          </Title>
          <p className="login-subtitle">智能图片标注与管理系统</p>
        </div>

        <Form
          form={form}
          name="login-register"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入账号' },
              { min: 2, max: 20, message: '账号长度在 2 到 20 个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="账号" 
              className="tech-input"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 5, max: 20, message: '密码长度在 5 到 20 个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="site-form-item-icon" />} 
              placeholder="密码" 
              className="tech-input"
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="site-form-item-icon" />} 
                placeholder="确认密码" 
                className="tech-input"
              />
            </Form.Item>
          )}

          {captchaEnabled && (
            <Form.Item required style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Form.Item
                  name="code"
                  noStyle
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <Input 
                    prefix={<SafetyCertificateOutlined className="site-form-item-icon" />} 
                    placeholder="验证码" 
                    className="tech-input"
                    style={{ flex: 1 }}
                  />
                </Form.Item>
                <div className="captcha-img-wrapper" onClick={fetchCaptcha}>
                  {captchaUrl ? (
                    <img src={captchaUrl} alt="captcha" className="captcha-img" />
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
              </div>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 12 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-button" 
              loading={loading}
              block
            >
              {isRegister ? '立即注册' : '登录系统'}
            </Button>
          </Form.Item>

          {registerEnabled && (
            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={toggleMode} style={{ color: 'var(--secondary-color)' }}>
                {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
              </Button>
            </div>
          )}
        </Form>
      </motion.div>
      
      <div className="login-footer">
        <p>© 2026 Image Annotation System. All Rights Reserved.</p>
      </div>
    </div>
  )
}
