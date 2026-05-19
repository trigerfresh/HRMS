import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Image,
  Alert,
  InputGroup,
} from 'react-bootstrap'
import { FaUser, FaLock, FaBuilding, FaCodeBranch } from 'react-icons/fa'
import logo from '../../assets/images/logo2.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [branch, setBranch] = useState('')
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/')
  }, [navigate])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/companies')
        setCompanies(res.data)
        // console.log(res.data)
      } catch (err) {
        console.error('Error fetching companies', err)
      }
    }
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (company) {
      const fetchBranches = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/branches/by-company/${company}`,
          )
          setBranches(res.data)
        } catch (err) {
          console.error('Error fetching branches', err)
        }
      }
      fetchBranches()
    } else {
      setBranches([])
    }
  }, [company])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          email,
          password,
          company,
          branch,
        },
      )
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      // console.log({ email, password, company, branch })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials.')
    }
  }

  return (
    <div className="login-wrapper">
      <Container className="d-flex justify-content-center align-items-center">
        <Card
          className="shadow-lg w-100"
          style={{ maxWidth: '900px', borderRadius: '1rem' }}
        >
          <Row className="g-0 flex-column flex-lg-row">
            {/* Left Side - Form */}
            <Col
              xs={12}
              lg={6}
              className="d-flex flex-column justify-content-center p-4 p-lg-5 bg-white"
            >
              <div className="text-center mb-4">
                <h3 className="fw-bold text-primary">Welcome to HRMS</h3>
                <p className="text-muted">
                  Please login to your account to continue
                </p>
              </div>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaUser className="text-secondary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      placeholder="Username / Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock className="text-secondary" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaBuilding className="text-secondary" />
                    </InputGroup.Text>
                    <Form.Select
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value)
                        setBranch('')
                      }}
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                        </option>
                      ))}
                    </Form.Select>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCodeBranch className="text-secondary" />
                    </InputGroup.Text>
                    <Form.Select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={!company}
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-grid mb-3">
                  <Button variant="primary" type="submit" size="lg">
                    Login
                  </Button>
                </div>
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-decoration-none small text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
              </Form>
            </Col>

            {/* Right Side - Logo */}
            <Col
              xs={12}
              lg={6}
              className="d-flex align-items-center justify-content-center bg-light p-4 login-image-section"
            >
              <Image
                src={logo}
                alt="Company Logo"
                fluid
                rounded
                className="p-3"
                style={{ maxHeight: '350px', objectFit: 'contain' }}
              />
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  )
}
