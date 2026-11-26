/** Option lists (and their labels) shared by the forms. */
export type Option<T extends string = string> = { value: T; label: string };

export const AGE_OPTIONS: Option[] = [
  { value: 'child', label: 'Child (under 13)' },
  { value: 'teen', label: 'Teen (13–17)' },
  { value: 'adult', label: 'Adult (18–59)' },
  { value: 'senior', label: 'Older adult (60+)' },
];
export const OCCUPATION_OPTIONS: Option[] = [
  { value: 'student', label: 'Student' },
  { value: 'office', label: 'Office / indoor work' },
  { value: 'remote', label: 'Work from home' },
  { value: 'field_outdoor', label: 'Outdoor / field work' },
  { value: 'driver_delivery', label: 'Driver / delivery' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];
export const COMMUTE_OPTIONS: Option[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'two_wheeler', label: 'Motorbike / scooter' },
  { value: 'car', label: 'Car (alone)' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro', label: 'Metro / train' },
  { value: 'carpool', label: 'Carpool' },
  { value: 'work_from_home', label: 'No commute (home)' },
];
export const OUTDOOR_OPTIONS: Option[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'weekly', label: 'About once a week' },
  { value: 'several_per_week', label: 'Several times a week' },
  { value: 'daily', label: 'Daily' },
];
export const LIFESTYLE_OPTIONS: Option[] = [
  { value: 'outdoor_exercise', label: 'I exercise outdoors' },
  { value: 'indoor_exercise', label: 'I prefer indoor exercise' },
  { value: 'cooks_daily', label: 'I cook daily at home' },
  { value: 'has_pets', label: 'I have pets' },
  { value: 'eco_focused', label: 'I want to cut my emissions' },
  { value: 'budget_conscious', label: 'I am budget-conscious' },
];
export const SENSITIVITY_OPTIONS: Option[] = [
  { value: 'asthma', label: 'Asthma' },
  { value: 'respiratory', label: 'Other breathing condition' },
  { value: 'heart', label: 'Heart condition' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'allergies', label: 'Allergies' },
];
export const BUDGET_OPTIONS: Option[] = [
  { value: 'free', label: 'Free only' },
  { value: 'low', label: 'Low (up to ~₹2,000)' },
  { value: 'medium', label: 'Medium (~₹2,000–15,000)' },
  { value: 'high', label: 'High (₹15,000+)' },
];
export const VENTILATION_OPTIONS: Option[] = [
  { value: 'good', label: 'Good (several windows / cross-breeze)' },
  { value: 'limited', label: 'Limited (few windows)' },
  { value: 'none', label: 'Very little natural ventilation' },
];
export const MODE_OPTIONS: Option[] = [
  { value: 'car_petrol', label: 'Car (petrol, alone)' },
  { value: 'car_diesel', label: 'Car (diesel, alone)' },
  { value: 'two_wheeler', label: 'Motorbike / scooter' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro', label: 'Metro / train' },
  { value: 'carpool', label: 'Carpool (3 riders)' },
  { value: 'ev_car', label: 'Electric car' },
  { value: 'e_scooter', label: 'Electric scooter / e-bike' },
  { value: 'cycle', label: 'Cycling' },
  { value: 'walk', label: 'Walking' },
];
export const ACTIVITY_OPTIONS: Option[] = [
  { value: 'metro', label: 'Metro / train trip' },
  { value: 'bus', label: 'Bus trip' },
  { value: 'carpool', label: 'Carpool trip' },
  { value: 'walk', label: 'Walked instead of driving' },
  { value: 'cycle', label: 'Cycled instead of driving' },
  { value: 'e_scooter', label: 'E-scooter / e-bike trip' },
  { value: 'ev_car', label: 'Electric car trip' },
  { value: 'avoided_trip', label: 'Avoided an unnecessary vehicle trip' },
  { value: 'household_habit', label: 'Sustainable household habit' },
];
export const REPORT_TYPE_OPTIONS: Option[] = [
  { value: 'garbage_burning', label: 'Open garbage burning' },
  { value: 'construction_dust', label: 'Construction dust' },
  { value: 'vehicle_emissions', label: 'Excessive vehicle emissions' },
  { value: 'industrial_smoke', label: 'Industrial smoke' },
  { value: 'other', label: 'Other visible pollution' },
];

export const labelOf = (opts: Option[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
