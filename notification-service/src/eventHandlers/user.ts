export const handleUserCreated = async (event: any) => {
  const { employeeId, email, role, name } = event;

  console.log(`New user is created with ${employeeId}, ${name}, ${role}, and ${email}`);

  // email / push / SMS logic here
};