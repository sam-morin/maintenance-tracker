import { ActionIcon, Box, Button, Center, Container, Group, Loader, Modal, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import MaintenanceTable from "./components/MaintenanceTable";
import { IconArrowLeft, IconPencil, IconTrash } from "@tabler/icons-react";

export default function CompanyDashboard() {
	const companyID = window.location.pathname.split("/")[2];
	const [company, setCompany] = useState({});
	const [loadingCompany, setLoadingCompany] = useState(true);
	const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
	const [editedCompany, setEditedCompany] = useState(company);
	const [loadingEditCompany, setLoadingEditCompany] = useState(false);
	const [loadingDeleteCompany, setLoadingDeleteCompany] = useState(false);
	const [deleteCompanyModalOpen, setDeleteCompanyModalOpen] = useState(false);

	const handleGetCompanyInfo = async () => {
		setLoadingCompany(true);
		try {
			const res = await fetch(`http://localhost:8000/companies/${companyID}`);
			const data = await res.json();
			setCompany(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingCompany(false);
		}
	};

	useEffect(() => {
		handleGetCompanyInfo();
	},[])

	console.log(companyID);

	const handleSaveUpdatedCompany = async () => {
		setLoadingEditCompany(true);
		try {
			const res = await fetch(`http://localhost:8000/companies/${companyID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(editedCompany),
			});
			const data = await res.json();
			console.log(data);
			handleGetCompanyInfo();
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingEditCompany(false);
			setEditCompanyModalOpen(false);
		}
	};

	const handleDeleteCompany = async () => {
		setLoadingCompany(true);
		try {
			const res = await fetch(`http://localhost:8000/companies/${companyID}`, {
				method: "DELETE",
			});
			const data = await res.json();
			console.log(data);
			window.location.href = "/companies";
		} catch (err) {
			console.error(err);
		} finally {
			setDeleteCompanyModalOpen(false);
		}
	};
	
	return (
		<div>
			<Modal
				opened={deleteCompanyModalOpen}
				withCloseButton={false}
				onClose={() => setDeleteCompanyModalOpen(false)}
				title={<Title order={3}>Delete Company</Title>}
			>
				<Stack>
					<Text>Are you sure you want to delete this company?</Text>
					<Group justify="flex-end">
						<Button
							variant="filled"
							color="red"
							onClick={() => {
								handleDeleteCompany();
							}}
							loading={loadingDeleteCompany}
							disabled={loadingDeleteCompany}
						>
							Yes, I'm sure
						</Button>
					</Group>
				</Stack>
			</Modal>
			<Modal
				opened={editCompanyModalOpen}
				withCloseButton={false}
				onClose={() => setEditCompanyModalOpen(false)}
				title={<Text size={'28px'} fw={700}>Edit Company</Text>}
			>
				<Stack>
					<TextInput
						defaultValue={company.name}
						autoFocus
						variant="filled"
						label="Name"
						onChange={(e) => {
							setEditedCompany({ ...editedCompany, name: e.target.value });
						}}
					/>
					<TextInput
						defaultValue={company.address}
						autoFocus
						variant="filled"
						label="Address"
						onChange={(e) => {
							setEditedCompany({ ...editedCompany, address: e.target.value });
						}}
					/>
					<TextInput
						defaultValue={company.point_of_contact}
						autoFocus
						variant="filled"
						label="Point of contact"
						onChange={(e) => {
							setEditedCompany({ ...editedCompany, point_of_contact: e.target.value });
						}}
					/>
					<Group justify="flex-end">
						<Button
							variant="filled"
							color="grey"
							onClick={() => {
								handleSaveUpdatedCompany();
							}}
							loading={loadingEditCompany}
							disabled={loadingEditCompany}
						>
							Save
						</Button>
					</Group>
				</Stack>
			</Modal>

			{loadingCompany ? (
				<Center h={"100%"}>
					<Loader />
				</Center>
			) : (
				<div style={{ padding: "1rem" }}>
					<Stack gap={"xs"}>
						<Group>
							<Group>
								<ActionIcon
									variant="subtle"
									color="grey"
									onClick={() => {
										window.location.href = "/companies";
									}}
								>
									<IconArrowLeft />
								</ActionIcon>
								{company.last_updated &&
									<ActionIcon
										variant="subtle"
										color="grey"
										onClick={() => {
											setEditCompanyModalOpen(true);
										}}
									>
										<IconPencil />
									</ActionIcon>
								}
								{company.last_updated &&
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() => {
											setDeleteCompanyModalOpen(true);
										}}
									>
										<IconTrash />
									</ActionIcon>
								}
							</Group>
							<Title order={1}>{company.name}</Title>
						</Group>

						<Group>
							<Text>{company.address}</Text>
							<Text>{company.point_of_contact}</Text>
							<Tooltip label={company.id}>
								<Text size="xs" c={"dimmed"}>{company.id.slice(-6)}</Text>
							</Tooltip>
						</Group>
					</Stack>

					<Container size="100%" py="md">
						<MaintenanceTable />
					</Container>
				</div>
			)}
		</div>
	);
}