export function MaintenanceReminders({ reminders }: { reminders: string[] }) {
  return (
    <section aria-labelledby="maint-h">
      <h2 id="maint-h" className="mb-2 text-lg font-semibold">
        Maintenance reminders
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {reminders.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </section>
  );
}
