import { useEffect, useState } from 'react';
import { Title, Container, Card, Progress, Table, Text, Loader, Group } from '@mantine/core';
import { Routes, Route } from "react-router-dom";
import CompaniesTable from './CompaniesTable';
import CompanyDashboard from './CompanyDashboard';
import MainDashboard from './MainDashboard';
import './App.css';

function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksByCompany, setTasksByCompany] = useState({}); // { companyId: [{instance}] }

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/companies/');
        const data = await res.json();
        setCompanies(data);

        // For demo: fetch tasks instances per company
        const tasksData = {};
        for (let company of data) {
          // Replace with your real API
          const res2 = await fetch(`http://localhost:8000/progress/${company.id}`);
          const cycleData = await res2.json();

          tasksData[company.id] = cycleData.tasks || [];
          company.progress_percent = cycleData.progress_percent || 0;
        }

        setTasksByCompany(tasksData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
      <Route path="/companies" element={<CompaniesTable />} />
      <Route path='/companies/:id' element={<CompanyDashboard />} />
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;
