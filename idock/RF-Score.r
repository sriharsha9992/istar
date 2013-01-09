args = commandArgs(trailingOnly = TRUE)
suppressMessages(library(randomForest))
load("RF-Score_model12_originalFeats.Rdata")
write.table(predict(RF_Score, read.csv(args[1])), file = args[2], quote = FALSE, row.names = FALSE, col.names = FALSE)
