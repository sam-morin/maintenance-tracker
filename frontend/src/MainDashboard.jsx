import { SimpleGrid, Title, Box, TextInput, Stack, Button } from "@mantine/core";
import { useState } from "react";

export default function MainDashboard() {
	const [newCompany, setNewCompany] = useState({});
	const [loadingCreateNewCompany, setLoadingCreateNewCompany] = useState(false);

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

	return (
		<div style={{ padding: '1rem' }}>
			<Title order={1}>Main Dashboard</Title>
			<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
				<Stack>
					<Title>
						Create Company
					</Title>
					<TextInput 
						placeholder="Company Name"
						autoFocus
						variant="filled"
						value={newCompany.name}
						onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
					/>
					<TextInput 
						placeholder="Address"
						value={newCompany.address}
						variant="filled"
						onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
					/>
					<TextInput 
						placeholder="Point of Contact"
						variant="filled"
						value={newCompany.point_of_contact}
						onChange={(e) => setNewCompany({ ...newCompany, point_of_contact: e.target.value })}
					/>
					<Button
						onClick={createNewCompany}
						disabled={!newCompany.name || !newCompany.address || !newCompany.point_of_contact}
						loading={loadingCreateNewCompany}
					>
						Submit
					</Button>
				</Stack>
				<Box>
					<Title>
						Create Task
					</Title>
				</Box>
			</SimpleGrid>
		</div>
	);
}