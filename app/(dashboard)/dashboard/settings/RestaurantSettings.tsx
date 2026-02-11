import AdminCategories from "./AdminCategories";
import RestaurantDetails from "./RestaurantDetails";

/**
 * Convenience wrapper (presentational) for the Settings area.
 * Keeps a simple stacked layout that works well on mobile.
 */
export default function RestaurantSettings() {
  return (
    <div className="space-y-6">
      <RestaurantDetails />
      <AdminCategories />
    </div>
  );
}
