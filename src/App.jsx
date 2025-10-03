import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchUsers, addUser, updateUser, deleteUser } from "./store/usersSlice";
import {
  Table,
  Input,
  Button,
  Space,
  Typography,
  Form,
  Alert,
  Popconfirm,
  message,
  ConfigProvider,
  Modal,
  theme,
} from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function UsersList() {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.list || []);

  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteUser(id));
    message.success("User deleted!");
  };

  let filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  filtered.sort((a, b) => {
    const va = (a.name || "").toLowerCase();
    const vb = (b.name || "").toLowerCase();
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => <Link to={`/user/${record.id}`}>{text}</Link>,
    },
    { title: "Email", dataIndex: "email" },
    { title: "Company", dataIndex: ["company", "name"] },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setIsModalOpen({ edit: true, user: record })}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", padding: 24, height: "100%", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <div style={{ width: 250, marginRight: 24, background: "#f0f0f0", padding: 16, borderRadius: 8 }}>
        <Title level={3}>User Management</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" onClick={() => setIsModalOpen({ add: true })} block>
            Add User
          </Button>
          <Button icon={<SearchOutlined />} onClick={() => setSearchVisible(!searchVisible)} block>
            Search
          </Button>
          {searchVisible && (
            <Input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <Button icon={<FilterOutlined />} onClick={() => setSortAsc(!sortAsc)} block>
            {sortAsc ? "Asc" : "Desc"}
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div style={{ flexGrow: 1, background: "#fff", padding: 16, borderRadius: 8, display: "flex", flexDirection: "column" }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "8", "20"],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            position: ["bottomCenter"],
          }}
          style={{ flex: 1 }}
          scroll={pageSize > 8 ? { y: 400 } : undefined}
        />
      </div>

      {isModalOpen && <UserModal modal={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function UserModal({ modal, onClose }) {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.list || []);
  const editUser = modal.edit ? modal.user : null;

  const [name, setName] = useState(editUser?.name || "");
  const [email, setEmail] = useState(editUser?.email || "");
  const [company, setCompany] = useState(editUser?.company?.name || "");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setName(editUser?.name || "");
    setEmail(editUser?.email || "");
    setCompany(editUser?.company?.name || "");
    setValidationError("");
  }, [editUser]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedCompany = company.trim();

    if (!trimmedName || !trimmedEmail || !trimmedCompany) {
      setValidationError("Please fill in Name, Email, and Company.");
      return;
    }

    if (!editUser && users.some((u) => u.name.toLowerCase() === trimmedName.toLowerCase())) {
      setValidationError("A user with this name already exists.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (editUser) {
      dispatch(updateUser({ ...editUser, name: trimmedName, email: trimmedEmail, company: { name: trimmedCompany } }));
      message.success("User updated!");
    } else {
      dispatch(addUser({ id: Date.now(), name: trimmedName, email: trimmedEmail, company: { name: trimmedCompany } }));
      message.success("User added!");
    }

    onClose();
  };

  return (
    <Modal
      title={editUser ? "Edit User" : "Add User"}
      open
      onCancel={onClose}
      onOk={handleSubmit}
      okText={editUser ? "Update" : "Add"}
      cancelText="Cancel"
    >
      <Form layout="vertical">
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </Form.Item>
        <Form.Item label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Form.Item>
        {validationError && <Alert message={validationError} type="error" showIcon />}
      </Form>
    </Modal>
  );
}

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.list || []);
  const user = users.find((u) => u.id.toString() === id);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditCompany(user.company?.name || "");
      setValidationError("");
    }
  }, [user]);

  if (!user) return <Text type="danger">User not found!</Text>;

  const handleUpdate = () => {
    if (!editName.trim() || !editEmail.trim() || !editCompany.trim()) {
      setValidationError("Name, Email, and Company are required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    dispatch(updateUser({ ...user, name: editName.trim(), email: editEmail.trim(), company: { name: editCompany.trim() } }));
    message.success("User updated!");
  };

  return (
    <div style={{ display: "flex", height: "100%", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: 250, marginRight: 24, background: "#f0f0f0", padding: 16, borderRadius: 8 }}>
        <Title level={3}>User Info</Title>
        <Button onClick={() => navigate("/")} block>Back to List</Button>
      </div>

      <div style={{ flexGrow: 1, background: "#fff", padding: 16, borderRadius: 8, display: "flex", flexDirection: "column" }}>
        <Title level={2}>{user.name}</Title>
        <Form layout="vertical" style={{ flex: 1 }}>
          <Form.Item label="Name">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Email">
            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
          </Form.Item>
          <Form.Item label="Company">
            <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
          </Form.Item>
          <p><b>Phone:</b> {user.phone || "-"}</p>
          <p><b>Website:</b> {user.website || "-"}</p>

          {validationError && <Alert message={validationError} type="error" showIcon />}
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleUpdate}>Update</Button>
            <Button onClick={() => navigate("/")}>Back</Button>
          </Space>
        </Form>
      </div>
    </div>
  );
}

export default function App() {
  const lightVars = {
    "--bg-color": "#d8f5d8",
    "--text-color": "#1f1f1f",
    "--input-bg": "#e6ffe6",
  };

  Object.entries(lightVars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-color)" }}>
        <div style={{ height: 70, backgroundColor: "#48c9b0", display: "flex", alignItems: "center", padding: "0 24px" }}>
          <img src="logo.png" alt="Logo" style={{ height: 40 }} />
        </div>

        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Router>
            <Routes>
              <Route path="/" element={<UsersList />} />
              <Route path="/user/:id" element={<UserDetails />} />
            </Routes>
          </Router>
        </div>
      </div>
    </ConfigProvider>
  );
}
