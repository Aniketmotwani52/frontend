import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { ServiceList } from './ServiceList';
import { ServiceCategoryList } from './ServiceCategoryList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ServicesPage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="Services tabs">
          <Tab label="Services" sx={{ fontWeight: 600 }} />
          <Tab label="Categories" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <ServiceList />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <ServiceCategoryList />
      </CustomTabPanel>
    </Box>
  );
};
