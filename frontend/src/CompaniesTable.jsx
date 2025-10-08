import { ActionIcon, Button, Group, Loader, Modal, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { IconArrowRight, IconPlus } from '@tabler/icons-react';

export default function CompaniesTable() {
	const [companies, setCompanies] = useState([]);
	const [loadingCompanies, setLoadingCompanies] = useState(true);
	const [newCompany, setNewCompany] = useState({});
	const [loadingCreateNewCompany, setLoadingCreateNewCompany] = useState(false);
	const [newCompanyModalOpen, setNewCompanyModalOpen] = useState(false);

	useEffect(() => {
		setLoadingCompanies(true);
		try {
			fetch("http://localhost:8000/companies/")
				.then((res) => res.json())
				.then((data) => setCompanies(data));
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingCompanies(false);
		}
	},[])

	const createNewCompany = async () => {
		try {
			setLoadingCreateNewCompany(true)
			const res = await fetch('http://localhost:8000/companies/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newCompany)
			})
			console.log(res)
			const data = await res.json()
			console.log(data)
			window.location.href = `/companies/${data.id}`
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingCreateNewCompany(false)
		}
	};

	const rows = companies.map((company) => (
    <Table.Tr key={company.id}>
      {/* <Table.Td>{company.id}</Table.Td> */}
      <Table.Td>{company.name}</Table.Td>
      <Table.Td>{company.address}</Table.Td>
      <Table.Td>{company.point_of_contact}</Table.Td>
			<Table.Td>{company.last_updated}</Table.Td>
			<Table.Td>{company.last_updated_by}</Table.Td>
			<Table.Td>
				<ActionIcon
					variant="subtle"
					color="grey"
					onClick={() => {
						window.location.href = `/companies/${company.id}`;
					}}
				>
					<IconArrowRight />
				</ActionIcon>
			</Table.Td>
    </Table.Tr>
  ));

	return (
		<div style={{ padding: '1rem' }}>
			<Modal
				opened={newCompanyModalOpen}
				// size="lg"
				title={<Text size={'28px'} fw={700}>New Company</Text>}
				onClose={() => setNewCompanyModalOpen(false)}
			>
				<Stack>
					<TextInput 
						label="Name"
						required
						autoFocus
						placeholder="Krispy Kreme Donuts"
						value={newCompany.name}
						onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
						variant="filled"
					/>
					<TextInput 
						label="Address"
						placeholder="123 Main Street Anytown, USA"
						value={newCompany.address}
						onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
						variant="filled"
					/>
					<TextInput 
						label="Point of Contact"
						required
						placeholder="Jeffrey Krispy"
						value={newCompany.point_of_contact}
						onChange={(e) => setNewCompany({ ...newCompany, point_of_contact: e.target.value })}
						variant="filled"
					/>
					<Group justify="flex-end">
						<Button
							onClick={createNewCompany}
							disabled={!newCompany.name || !newCompany.address || !newCompany.point_of_contact}
							loading={loadingCreateNewCompany}
						>
							Submit
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Group position="apart">
				<Title order={1}>Companies</Title>
				<ActionIcon
					variant="subtle"
					color="grey"
					onClick={() => setNewCompanyModalOpen(true)}
				>
					<IconPlus />
				</ActionIcon>
			</Group>
			{companies && companies.length > 0 ? (
				<Table>
					<Table.Thead>
						<Table.Tr>
							{/* <Table.Th>ID</Table.Th> */}
							<Table.Th>Name</Table.Th>
							<Table.Th>Address</Table.Th>
							<Table.Th>Point of contact</Table.Th>
							<Table.Th>Last updated</Table.Th>
							<Table.Th>Last updated by</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			) : loadingCompanies ? (
				<Loader />
			) : (
				<Text>No companies found</Text>
			)}
		</div>
	)
}