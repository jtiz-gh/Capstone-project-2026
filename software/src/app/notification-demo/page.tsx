// Example page for device registration demo
export default function DeviceRegistrationDemo() {
  return (
    <div>
      <h1>Device Registration Demo</h1>
      <p>This page will show notifications in real time when the backend triggers them.</p>
      <p>Try sending a POST request to <code>/api/notifications</code> with a JSON body like <code>{'{"message": "Hello from backend!"}'}</code> to test.</p>
    </div>
  );
}
