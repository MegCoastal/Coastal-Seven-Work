import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import SupportChatDrawer from "./components/SupportChatDrawer";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <AppRoutes />
      <AIAssistantDrawer />
      <SupportChatDrawer />
      <Footer />
    </div>
  );
}

export default App;
