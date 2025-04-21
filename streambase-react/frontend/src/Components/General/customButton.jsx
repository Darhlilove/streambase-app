import React from "react";
import { Button } from "@mui/material";
import Theme from "../../Styles/Theme.jsx";

const CustomButton = ({
                          backgroundColor = "#FEB508" ,
                          color, hoverColor = "#e6a102",
                          buttonLabel,
                          padding = "10px 20px",
                          onClick,
                          fontSize = 11,
                          borderRadius = "20px",
                          fontWeight = "700"
}) => {
    return (
        <Button
            sx={{
                backgroundColor: { backgroundColor },
                color: color || Theme.palette.background.default,
                borderRadius: borderRadius,
                padding: padding,
                fontSize: fontSize,
                fontWeight: fontWeight,
                "&:hover": {
                    backgroundColor: hoverColor,
                }
            }}
            onClick={onClick}
        >
            { buttonLabel }
        </Button>
    );
};

export default CustomButton;
