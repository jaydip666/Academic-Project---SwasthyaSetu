						Date - 05/02/2025
						Author - Jaydip S. Gavare
						Objective - Student Management System

#include<stdio.h>
#include<conio.h>
#include<stdio.h>
#include<conio.h>
//  User Defined DataType--Structure---Data---Insert,update,delete,searching,Sorting
struct Student
{
	int rno;
	char name[50];
	int std;
	int marks;
	int active;
};

#define SIZE 1000

struct Student srecords[SIZE];

int index = 0 , rnos=1;

void printStudent(struct Student s);

void addStudent()
{
	struct Student s;
	if(index==SIZE)
	{
		printf("\nStudent List are full.");
		return;
	}

	s.rno = rnos;
	flushall();
	printf("\nEnter Name : ");
	gets(s.name);
	printf("\nEnter Std : ");
	scanf("%d",&s.std);
	printf("\nEnter Marks : ");
	scanf("%d",&s.marks);

	s.active = 1;

	// s-- data---ready
	srecords[index]  = s;

	index++;
	rnos++;
	printf("\nStudent record are succssfully Inserted ...!");
}
void displayStudents()
{
	int i;
	if(index == 0)
	{
		printf("\nList of Student records are empty");
		return ;
	}
	for(i=0;i<index;i++)
	{
		if(srecords[i].active == 1)
		{
			printStudent(srecords[i]);
		}
	}
}
void deleteStudentbyId()
{
	int i,rno,flag=1;
	printf("\nEnter Rno Which you want to Delete Student record: ");
	scanf("%d",&rno);

	for(i=0;i<index;i++)
	{
		if(srecords[i].rno == rno)
		{
			srecords[i].active = 0;
			printf("\nStudent Rno : %d is deleted from list.",srecords[i].rno);
			flag=0;
			break;
		}
	}
	if(flag)
	{
		printf("\nStudent Rno : %d is not found in Student records.",rno);
	}
}
void searchStudentById()
{
	int i,rno,flag=1;
	printf("\nEnter Rno Which you want to Search Student record: ");
	scanf("%d",&rno);

	for(i=0;i<index;i++)
	{
		if(srecords[i].rno == rno)
		{
			printStudent(srecords[i]);
			flag=0;
			break;
		}
	}
	if(flag)
	{
		printf("\nStudent Rno : %d is not found in Student records.",rno);
	}
}
void updateStudentById()
{
	int i,rno,flag=1;
	printf("\nEnter Rno Which you want to Update Student record: ");
	scanf("%d",&rno);
	for(i=0;i<index;i++)
	{
		if(srecords[i].rno == rno)
		{
			// update-->name std marks
			flushall();
			printf("\nEnter Name : ");
			gets(srecords[i].name);
			printf("\nEnter Std : ");
			scanf("%d",&srecords[i].std);
			printf("\nEnter Marks : ");
			scanf("%d",&srecords[i].marks);
			flag=0;
			printf("\nStudent Rno : %d is Updated from list.",srecords[i].rno);
			break;
		}
	}
	if(flag)
	{
		printf("\nStudent Rno : %d is not found in Student records.",rno);
	}
}
void sortStudentByMarks()
{
	struct Student temp;
	int i,j;
	if(index == 0)
	{
		printf("\nList of Student records are empty");
		return ;
	}
	for(i=0;i<index;i++)
	{
		for(j=(i+1);j<index;j++)
		{
			// sorting By Marks wise
			if(srecords[i].marks < srecords[j].marks)
			{
				temp = srecords[i];
				srecords[i] = srecords[j];
				srecords[j] = temp;
			}
		}
	}
	printf("\nStudent records are successfully sorted by Marks wise.");
	displayStudents();
}
void printStudent(struct Student s)
{
	printf("\n%d\t%s\t%d\t%d",s.rno,s.name,s.std,s.marks);
}

void main()
{
	int choice;
	clrscr();

	do
	{
		printf("\nEnter below Choice : ");
		printf("\n1) Add Student ");
		printf("\n2) Update Student By Id");
		printf("\n3) Delete Student By Id");
		printf("\n4) Display All Student Information ");
		printf("\n5) Searching by Student Id");
		printf("\n6) Sorting By Student Marks");
		printf("\n7) Exit Student Application");
		scanf("%d",&choice);

		switch(choice)
		{
			case 1: addStudent();
				break;

			case 2: updateStudentById();
				break;

			case 3: deleteStudentbyId();
				break;

			case 4: displayStudents();
				break;

			case 5: searchStudentById();
				break;

			case 6: sortStudentByMarks();
				break;

			case 7: printf("\nSudent Application Exit");
				delay(1000);
				exit(1);
				break;
		}

	}while(choice!=7);

	getch();
}