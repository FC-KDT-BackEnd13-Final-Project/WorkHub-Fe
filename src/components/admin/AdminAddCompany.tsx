import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export function AdminAddCompany() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    registration: "",
    address: "",
    manager: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate("/admin/users/add/success");
  };

  const handleReset = () => {
    setForm({ name: "", registration: "", address: "", manager: "", phone: "", email: "" });
  };

  return (
    <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-2xl">Add Company</CardTitle>
        <CardDescription>Register a new client organization and main point of contact.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-registration">Business Registration (optional)</Label>
              <Input
                id="company-registration"
                value={form.registration}
                onChange={(event) => setForm((prev) => ({ ...prev, registration: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">Company Address</Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                id="company-address"
                placeholder="Search or enter address"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                className="flex-1"
              />
              <Button type="button" variant="outline" className="md:w-auto">
                Search
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-manager">Manager Name</Label>
              <Input
                id="company-manager"
                required
                value={form.manager}
                onChange={(event) => setForm((prev) => ({ ...prev, manager: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Manager Phone</Label>
              <Input
                id="company-phone"
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">Manager Email</Label>
            <Input
              id="company-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Button type="submit" className="flex-1">
              Register Company
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
