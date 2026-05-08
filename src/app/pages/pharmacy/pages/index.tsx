import { PharmacyDashboard } from "../Dashboard";
import { PharmacyOrdersPage } from "./Orders";

export { PharmacyDashboard, PharmacyOrdersPage };

export function PharmacyShippingPage() { 
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Shipping Queue</h1>
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Label generation and courier integration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  ); 
}

export function PharmacyInventoryPage() { 
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Inventory & Compounding</h1>
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Real-time stock tracking and SKU management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  ); 
}

export function PharmacySettingsPage() { 
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Pharmacy Settings</h1>
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Dispensary credentials and API integration settings.</p>
        </CardContent>
      </Card>
    </div>
  ); 
}
