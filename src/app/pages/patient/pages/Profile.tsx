import { useState } from "react";
import { Camera, Edit2, Save, Globe, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function ProfilePage() {
  const [editing, setEditing] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Profile</h1>
        <Button size="sm" variant={editing ? "primary" : "outline"} className="rounded-full gap-1.5 text-xs" onClick={() => setEditing(e => !e)}>
          {editing ? <><Save className="h-3.5 w-3.5" /> Save</> : <><Edit2 className="h-3.5 w-3.5" /> Edit</>}
        </Button>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                JD
              </div>
              {editing && (
                <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">John Doe</h2>
              <p className="text-sm text-muted-foreground">Patient ID: BH-2024-00492</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" className="text-[10px]">Verified</Badge>
                <Badge variant="secondary" className="text-[10px]">Premium Plan</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[
            { label: "Full Name", value: "John Michael Doe", icon: null },
            { label: "Date of Birth", value: "March 15, 1985", icon: Calendar },
            { label: "Phone", value: "+1 (555) 234-5678", icon: Phone },
            { label: "Email", value: "john.doe@email.com", icon: Mail },
            { label: "Address", value: "123 Main St, New York, NY 10001", icon: MapPin },
            { label: "Language", value: "English", icon: Globe },
          ].map((field, i) => (
            <div key={i} className="flex items-center gap-3">
              {field.icon && <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{field.label}</p>
                {editing
                  ? <input defaultValue={field.value} className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:border-primary mt-0.5" />
                  : <p className="text-sm font-medium">{field.value}</p>
                }
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medical Info */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[
            { label: "Blood Type", value: "O+" },
            { label: "Height", value: "5'11\" (180 cm)" },
            { label: "Weight", value: "175 lbs (79 kg)" },
            { label: "Allergies", value: "Penicillin, Shellfish" },
            { label: "Emergency Contact", value: "Jane Doe — +1 (555) 987-6543" },
          ].map((field, i) => (
            <div key={i}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{field.label}</p>
              {editing
                ? <input defaultValue={field.value} className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:border-primary mt-0.5" />
                : <p className="text-sm font-medium mt-0.5">{field.value}</p>
              }
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
