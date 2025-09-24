import Homepage from "../components/Homepage";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/app');
  };
  
  const handleLogin = () => {
    navigate('/app');
  };
  
  return <Homepage onGetStarted={handleGetStarted} onLogin={handleLogin} />;
};

export default Index;
