"use client";

import { useState, useEffect } from "react";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Save,
  MapPin,
  Navigation,
  Pencil,
  X,
  Briefcase,
  User as UserIcon,
  Home,
  Building2,
} from "lucide-react";
import { IEmployeeDetail } from "@/app/types/user";
import LocationInput from "@/components/form-elements/LocationInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function SettingsPage() {
  const user = useAppUser();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locating, setLocating] = useState<"home" | "work" | null>(null);

  const [formData, setFormData] = useState<IEmployeeDetail>({
    identityNumber: "",
    jobTitle: "",
    department: "",
    homeAddress: { street: "", city: "", zip: "", country: "" },
    workAddress: { street: "", city: "", zip: "", country: "" },
  });
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      if (user.employeeDetail) {
        setFormData({
          identityNumber: user.employeeDetail.identityNumber || "",
          jobTitle: user.employeeDetail.jobTitle || "",
          department: user.employeeDetail.department || "",
          homeAddress: {
            ...formData.homeAddress,
            ...user.employeeDetail.homeAddress,
          },
          workAddress: {
            ...formData.workAddress,
            ...user.employeeDetail.workAddress,
          },
        });
      }
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (
    type: "homeAddress" | "workAddress",
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  interface AddressComponent {
    long_name: string;
    types: string[];
  }

  const parseAddressComponents = (components: AddressComponent[]) => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let country = "";
    let zip = "";

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (types.includes("route")) {
        route = component.long_name;
      }
      if (types.includes("locality") || types.includes("postal_town")) {
        city = component.long_name;
      }
      if (!city && types.includes("administrative_area_level_1")) {
        city = component.long_name;
      }
      if (types.includes("country")) {
        country = component.long_name;
      }
      if (types.includes("postal_code")) {
        zip = component.long_name;
      }
    });

    const fullStreet = `${route} ${streetNumber}`.trim();
    return {
      street: fullStreet,
      city,
      country,
      zip,
    };
  };

  const handleUseCurrentLocation = (type: "homeAddress" | "workAddress") => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(type === "homeAddress" ? "home" : "work");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/maps/reverse?lat=${latitude}&lng=${longitude}`,
          );
          const data = await res.json();

          if (data.success && data.components) {
            const parsed = parseAddressComponents(data.components);

            setFormData((prev) => ({
              ...prev,
              [type]: {
                ...prev[type],
                street: parsed.street || data.formattedAddress,
                city: parsed.city,
                country: parsed.country,
                zip: parsed.zip,
              },
            }));
          } else {
            alert("Could not determine address details.");
          }
        } catch (error) {
          console.error(error);
          alert("Failed to get location address.");
        } finally {
          setLocating(null);
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location.");
        setLocating(null);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          name: name,
          employeeDetail: formData,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
      } else {
        alert("Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW MODE ---
  if (!isEditing) {
    return (
      <AuthGuard>
        <div className="w-full max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your personal information and addresses.
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.picture} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-xl">{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" /> Personal
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Name
                  </Label>
                  <div className="font-medium">{name || "Not set"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Job Title
                  </Label>
                  <div className="font-medium">
                    {formData.jobTitle || "Not set"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Department
                  </Label>
                  <div className="font-medium">
                    {formData.department || "Not set"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">
                    Identity / Employee ID
                  </Label>
                  <div className="font-medium">
                    {formData.identityNumber || "Not set"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-muted-foreground text-xs uppercase mb-0 pb-0">
                      Home Address
                    </Label>
                  </div>
                  <div className="font-medium pl-6">
                    {formData.homeAddress?.street ? (
                      <>
                        {formData.homeAddress.street}
                        <br />
                        {[formData.homeAddress.zip, formData.homeAddress.city]
                          .filter(Boolean)
                          .join(" ")}
                        <br />
                        {formData.homeAddress.country}
                      </>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50"></div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-muted-foreground text-xs uppercase mb-0 pb-0">
                      Work Address
                    </Label>
                  </div>
                  <div className="font-medium pl-6">
                    {formData.workAddress?.street ? (
                      <>
                        {formData.workAddress.street}
                        <br />
                        {[formData.workAddress.zip, formData.workAddress.city]
                          .filter(Boolean)
                          .join(" ")}
                        <br />
                        {formData.workAddress.country}
                      </>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full max-w-4xl mx-auto py-10 px-4 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your name and professional details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => handleChange("jobTitle", e.target.value)}
                  placeholder="e.g. Senior Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label>Identity Number / Employee ID</Label>
                <Input
                  value={formData.identityNumber}
                  onChange={(e) =>
                    handleChange("identityNumber", e.target.value)
                  }
                  placeholder="e.g. 123456789"
                />
              </div>
            </CardContent>
          </Card>

          {/* Home Address Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Home Address</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseCurrentLocation("homeAddress")}
                  disabled={locating === "home"}
                >
                  {locating === "home" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Navigation className="h-3 w-3 mr-1 text-blue-500" />
                  )}
                  Use Current Location
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address / Full Address</Label>
                <LocationInput
                  id="home-street"
                  placeholder="Search home address..."
                  value={formData.homeAddress?.street || ""}
                  onChange={(val) =>
                    handleAddressChange("homeAddress", "street", val)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.homeAddress?.city}
                  onChange={(e) =>
                    handleAddressChange("homeAddress", "city", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  value={formData.homeAddress?.zip}
                  onChange={(e) =>
                    handleAddressChange("homeAddress", "zip", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.homeAddress?.country}
                  onChange={(e) =>
                    handleAddressChange(
                      "homeAddress",
                      "country",
                      e.target.value,
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Address Form */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Work Address</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseCurrentLocation("workAddress")}
                  disabled={locating === "work"}
                >
                  {locating === "work" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Navigation className="h-3 w-3 mr-1 text-blue-500" />
                  )}
                  Use Current Location
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address / Full Address</Label>
                <LocationInput
                  id="work-street"
                  placeholder="Search work address..."
                  value={formData.workAddress?.street || ""}
                  onChange={(val) =>
                    handleAddressChange("workAddress", "street", val)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.workAddress?.city}
                  onChange={(e) =>
                    handleAddressChange("workAddress", "city", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  value={formData.workAddress?.zip}
                  onChange={(e) =>
                    handleAddressChange("workAddress", "zip", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.workAddress?.country}
                  onChange={(e) =>
                    handleAddressChange(
                      "workAddress",
                      "country",
                      e.target.value,
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
