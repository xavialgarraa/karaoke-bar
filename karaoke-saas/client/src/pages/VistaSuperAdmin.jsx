import React, { useState } from 'react';

/* =========================
   🎨 ESTILOS PRO / SAAS
========================= */

const pageStyle = {
  background: 'radial-gradient(circle at top, #0f172a, #020617)',
  minHeight: '100vh',
  color: '#e5e7eb',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '40px'
};

const cardStyle = {
  background: 'linear-gradient(180deg, #121826, #0b1220)',
  border: '1px solid #1f2937',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,.4)'
};

const inputStyle = {
  padding: '12px 14px',
  background: '#020617',
  border: '1px solid #1f2937',
  color: '#e5e7eb',
  borderRadius: '10px',
  outline: 'none'
};

const primaryButton = {
  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  color: '#020617',
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer'
};

const ghostButton = {
  background: '#020617',
  color: '#9ca3af',
  border: '1px solid #1f2937',
  padding: '10px 16px',
  borderRadius: '10px',
  cursor: 'pointer'
};

const dangerButton = {
  background: 'linear-gradient(135deg,#fb7185,#e11d48)',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer'
};

/* =========================
   🚀 COMPONENTE
========================= */

const VistaSuperAdmin = () => {
  const [masterKey, setMasterKey] = useState(localStorage.getItem('SA_KEY') || '');
  const [isAuth, setIsAuth] = useState(false);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    nombreBar: '',
    slugBar: '',
    ubicacion: '',
    plan: 'PRO',
    email: '',
    password: ''
  });

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = async (e) => {
    e.preventDefault();
    if (masterKey) {
      localStorage.setItem('SA_KEY', masterKey);
      cargarClientes();
    }
  };

  /* =========================
     CARGAR CLIENTES
  ========================= */

  const cargarClientes = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_CLIENT_URL}/api/superadmin/tenants`,
        { headers: { 'x-master-key': masterKey } }
      );

      if (res.ok) {
        const data = await res.json();
        setClientes(data);
        setIsAuth(true);
      } else {
        alert('Clave incorrecta ❌');
        setIsAuth(false);
        localStorage.removeItem('SA_KEY');
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     CREAR CLIENTE
  ========================= */

  const handleCreate = async (e) => {
    e.preventDefault();

    const res = await fetch(
      `${import.meta.env.VITE_CLIENT_URL}/api/superadmin/create-tenant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-key': masterKey
        },
        body: JSON.stringify(form)
      }
    );

    if (res.ok) {
      alert('✅ Cliente creado con éxito');
      setForm({
        nombreBar: '',
        slugBar: '',
        ubicacion: '',
        plan: 'PRO',
        email: '',
        password: ''
      });
      cargarClientes();
    } else {
      const err = await res.json();
      alert('Error: ' + err.message);
    }
  };

  /* =========================
     BORRAR CLIENTE
  ========================= */

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que quieres borrar a ${nombre}?`)) return;

    const res = await fetch(
      `${import.meta.env.VITE_CLIENT_URL}/api/superadmin/tenant/${id}`,
      {
        method: 'DELETE',
        headers: { 'x-master-key': masterKey }
      }
    );

    if (res.ok) cargarClientes();
  };

  /* =========================
     LOGIN VIEW
  ========================= */

  if (!isAuth) {
    return (
      <div style={{ ...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...cardStyle, width: '360px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', marginBottom: '10px' }}>👑 Super Admin</h1>
          <p style={{ color: '#9ca3af', marginBottom: '30px' }}>
            Acceso restringido
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="password"
              placeholder="Master Key"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={primaryButton}>
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================
     PANEL
  ========================= */

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>🚀 Control Center</h1>
          <p style={{ color: '#9ca3af' }}>Gestión global de clientes SaaS</p>
        </div>
        <button
          style={ghostButton}
          onClick={() => {
            localStorage.removeItem('SA_KEY');
            setIsAuth(false);
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '40px' }}>
        {/* NUEVO CLIENTE */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>➕ Nuevo Cliente</h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input placeholder="Nombre Bar" value={form.nombreBar} onChange={e => setForm({ ...form, nombreBar: e.target.value })} style={inputStyle} required />
            <input placeholder="Slug URL" value={form.slugBar} onChange={e => setForm({ ...form, slugBar: e.target.value })} style={inputStyle} required />
            <input placeholder="Ubicación" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} style={inputStyle} />

            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={inputStyle}>
              <option value="FREE">Plan FREE</option>
              <option value="PRO">Plan PRO</option>
              <option value="ENTERPRISE">Plan ENTERPRISE</option>
            </select>

            <hr style={{ borderColor: '#1f2937' }} />

            <input type="email" placeholder="Email Admin" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} required />
            <input placeholder="Password Inicial" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} required />

            <button type="submit" style={primaryButton}>CREAR CLIENTE</button>
          </form>
        </div>

        {/* LISTA CLIENTES */}
        <div>
          <h2 style={{ marginBottom: '20px' }}>📂 Clientes Activos ({clientes.length})</h2>

          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ color: '#9ca3af', textAlign: 'left' }}>
                <th>ID</th>
                <th>Bar</th>
                <th>URL</th>
                <th>Plan</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {clientes.map(cli => (
                <tr key={cli.id} style={{ background: '#0b1220' }}>
                  <td style={{ padding: '16px' }}>{cli.id}</td>
                  <td style={{ fontWeight: 600 }}>{cli.nombre}</td>
                  <td style={{ color: '#38bdf8' }}>/{cli.slug}</td>
                  <td>
                    <span style={{
                      background: cli.plan === 'PRO'
                        ? 'linear-gradient(135deg,#facc15,#f59e0b)'
                        : '#1f2937',
                      color: '#000',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {cli.plan}
                    </span>
                  </td>
                  <td style={{ color: '#9ca3af' }}>{cli.email}</td>
                  <td>
                    <button style={dangerButton} onClick={() => handleDelete(cli.id, cli.nombre)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VistaSuperAdmin;
