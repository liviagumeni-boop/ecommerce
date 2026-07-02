import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}) {
  return (
    <div style={{ maxWidth: 200 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateRangePicker
          value={[
            startDate ? dayjs(startDate) : null,
            endDate ? dayjs(endDate) : null,
          ]}
          onChange={(newValue) => {
            onChange(
              newValue?.[0] ? newValue[0].format("YYYY-MM-DD") : "",
              newValue?.[1] ? newValue[1].format("YYYY-MM-DD") : ""
            );
          }}
          slotProps={{
            textField: {
              size: "small",
              className: "form-control",
              style: {
                maxWidth: 200,
                height: "38px",
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
}