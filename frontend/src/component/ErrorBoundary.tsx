import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Giao diện thay thế tùy chỉnh (nếu muốn truyền từ ngoài vào)
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  // 1. Hàm này được gọi khi có lỗi xảy ra trong component con.
  // Nó dùng để cập nhật state giúp render ra giao diện thay thế (fallback UI).
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // 2. Hàm này dùng để log lỗi ra các dịch vụ theo dõi (như Sentry, LogRocket)
  // hoặc đơn giản là console.error ra trình duyệt.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  // 3. Hàm xử lý khi người dùng bấm nút thử lại (Reset trang)
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      // Nếu có truyền custom fallback từ ngoài vào thì dùng, không thì dùng UI mặc định ở dưới
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Giao diện mặc định khi một phần hệ thống bị sập
      return (
        <div style={styles.container}>
          <h2 style={styles.title}>Đã có lỗi xảy ra ở khu vực này!</h2>
          <p style={styles.message}>
            {this.state.error?.message || "Vui lòng thử lại hoặc liên hệ quản trị viên."}
          </p>
          <button style={styles.button} onClick={this.handleReset}>
            Thử tải lại khu vực này
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles đơn giản cho giao diện lỗi
const styles = {
  container: {
    padding: "20px",
    margin: "10px",
    border: "1px dashed #ff4d4f",
    borderRadius: "8px",
    backgroundColor: "#fff2f0",
    textAlign: "center" as const,
  },
  title: {
    color: "#ff4d4f",
    margin: "0 0 10px 0",
    fontSize: "18px",
  },
  message: {
    color: "#595959",
    fontSize: "14px",
    marginBottom: "15px",
  },
  button: {
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ErrorBoundary;