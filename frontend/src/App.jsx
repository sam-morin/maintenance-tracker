import { useEffect, useState } from 'react';
import { Title, Container, Card, Progress, Table, Text, Loader, Group } from '@mantine/core';
import CompaniesTable from './CompaniesTable';

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
    <Container>
      <Title order={1} mb="md">Maintenance Tracker</Title>

      <CompaniesTable />

      {/* {companies.map(company => (
        <Card key={company.id} shadow="sm" padding="lg" mb="md">
          <Group position="apart">
            <Text weight={600}>{company.name}</Text>
            <Text size="sm">{company.progress_percent}% complete</Text>
          </Group>
          <Progress value={company.progress_percent} mt="sm" mb="md" />

          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(tasksByCompany[company.id] || []).map(task => (
                <tr key={task.id}>
                  <td>{task.assignment?.task?.name || 'Unnamed'}</td>
                  <td>{task.status}</td>
                  <td>{task.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ))} */}
    </Container>
  );
}

export default App;
