import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import SupportChatDrawer from "./components/SupportChatDrawer";
import AIWidget from "./components/AIWidget";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <AppRoutes />
      <AIAssistantDrawer />
      <SupportChatDrawer />
      <AIWidget />
      <Footer />
    </div>
  );
}

export default App;
