import Container from "@/app/components/Common/Container";
import RestaurantDetails from "./RestaurantDetails";
import AdminCategories from "./AdminCategories";

const AdminSettingsPage = () => {
  return (
    <Container>
      <section className="space-y-6">
        <RestaurantDetails />
        <AdminCategories />
      </section>
    </Container>
  );
};

export default AdminSettingsPage;
