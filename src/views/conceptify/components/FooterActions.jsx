// src/components/FooterActions.jsx
import React, { useState, forwardRef } from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slide,
    CircularProgress,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SkipNextIcon from '@mui/icons-material/SkipNext';

const Transition = forwardRef((props, ref) => (
    <Slide direction="up" ref={ref} {...props} />
));

export default function FooterActions({
    onSaveWork,
    onGenerateConfig,
    onClearCache,
    onBootAllMachines,
    snackbarOpen,
    onCloseSnackbar,
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [bootLoading, setBootLoading] = useState(false);
    const [bootResultOpen, setBootResultOpen] = useState(false);
    const [bootResults, setBootResults] = useState(null);

    const handleClearClick = () => setConfirmOpen(true);
    const handleCancelClear = () => setConfirmOpen(false);
    const handleConfirmClear = () => {
        setConfirmOpen(false);
        onClearCache();
    };

    const handleBootAllMachines = async () => {
        setBootLoading(true);
        try {
            const results = await onBootAllMachines();
            setBootResults(results);
            setBootResultOpen(true);
        } catch (error) {
            setBootResults({
                error: true,
                message: error.message || 'Failed to boot machines'
            });
            setBootResultOpen(true);
        } finally {
            setBootLoading(false);
        }
    };

    const handleCloseBootResults = () => {
        setBootResultOpen(false);
        setBootResults(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'failed':
                return <ErrorIcon color="error" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'skipped':
                return <SkipNextIcon color="warning" />;
            default:
                return <WarningIcon color="warning" />;
        }
    };

    return (
        <>
            {/* Footer buttons */}
            <Box p={2} display="flex" justifyContent="space-between">
                <Box>
                    <Button variant="contained" color="primary" onClick={onSaveWork}>
                        Save Work
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={onGenerateConfig}
                        sx={{ ml: 1 }}
                    >
                        Generate Config Files
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleBootAllMachines}
                        disabled={bootLoading}
                        startIcon={bootLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                        sx={{ ml: 1 }}
                    >
                        {bootLoading ? 'Booting...' : 'Boot All Machines'}
                    </Button>
                </Box>
                <Button variant="outlined" color="error" onClick={handleClearClick}>
                    Clear Cache
                </Button>
            </Box>

            {/* Save confirmation snackbar */}
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={onCloseSnackbar}
            >
                <Alert
                    onClose={onCloseSnackbar}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    Your work is saved for 10 minutes.
                </Alert>
            </Snackbar>

            {/* Boot Results Dialog */}
            <Dialog
                open={bootResultOpen}
                onClose={handleCloseBootResults}
                maxWidth="md"
                fullWidth
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        p: 2,
                    },
                }}
            >
                <DialogTitle>Boot All Machines Results</DialogTitle>
                <DialogContent>
                    {bootResults?.error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {bootResults.message}
                        </Alert>
                    ) : bootResults ? (
                        <>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {bootResults.message}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Total: {bootResults.total_machines} | Success: {bootResults.success_count}
                            </Typography>
                            {bootResults.results && bootResults.results.length > 0 && (
                                <List dense>
                                    {bootResults.results.map((result, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                {getStatusIcon(result.status)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={result.machine_name}
                                                secondary={
                                                    <span>
                                                        <strong>VM ID:</strong> {result.vm_id || 'N/A'} |
                                                        <strong> Status:</strong> {result.status} |
                                                        <strong> Message:</strong> {result.message}
                                                    </span>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </>
                    ) : (
                        <Typography>No results to display</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBootResults} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Clear Cache confirmation dialog */}
            <Dialog
                open={confirmOpen}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleCancelClear}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        p: 2,
                    },
                }}
            >
                <DialogTitle>Clear Cache?</DialogTitle>
                <DialogContent>
                    Are you sure you want to clear your work? This will erase all current edits.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelClear}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmClear}
                    >
                        Clear
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
