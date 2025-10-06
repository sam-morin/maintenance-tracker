import { ActionIcon, Loader, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { IconArrowRight } from '@tabler/icons-react';

export default function CompaniesTable() {
	const [companies, setCompanies] = useState([]);
	const [loadingCompanies, setLoadingCompanies] = useState(true);

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

	const rows = companies.map((company) => (
    <Table.Tr key={company.id}>
      <Table.Td>{company.id}</Table.Td>
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
		<>
			{companies && companies.length > 0 ? (
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>ID</Table.Th>
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
		</>
	)
}