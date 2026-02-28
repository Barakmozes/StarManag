import Container from '@/app/components/Common/Container';
import MyShifts from './MyShifts';
import { getCurrentUser } from '@/lib/session';
import { User } from '@prisma/client';

export default async function UserShiftsPage() {
  const user = await getCurrentUser();
  return (
    <Container>
      <MyShifts user={user as User} />
    </Container>
  );
}
