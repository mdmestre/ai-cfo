import api from "@/lib/api";
import { toast } from "sonner";

export function useReports() {
    const exportCSV = async () => {
        try {
            const response = await api.get("/reports/export/csv", {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `atlas_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Report downloaded successfully");
        } catch (error) {
            toast.error("Failed to generate report");
        }
    };

    return { exportCSV };
}
