import { createTheme } from "@material-ui/core/styles";

const org_placeholderTheme = createTheme({
  spacing: 0,
  palette: {
    primary: {
      main: "#fac014",
    },
  },
  overrides: {
    MuiButton: {
      containedPrimary: {
        color: "white",
        "&:hover": {
          backgroundColor: "#ffd866",
        },
      },
    },
  },
});

export default org_placeholderTheme;
